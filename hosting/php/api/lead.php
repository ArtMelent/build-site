<?php
/**
 * POST /api/lead on classic PHP hosting — receives the site's request form
 * and forwards it to Telegram and email. Mirrors server/lead.ts (used on Cloudflare Pages).
 * Settings: api/config.php (copy from config.example.php).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const MAX_BODY_BYTES = 10000;
const MIN_FILL_SECONDS = 2;
const WINDOW_SECONDS = 600;
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 5;

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean($value, int $max): string
{
    if (!is_string($value)) return '';
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr(trim($value), 0, $max);
}

function normalize_phone(string $raw): ?string
{
    $digits = preg_replace('/\D/', '', $raw) ?? '';
    if (preg_match('/^0\d{9}$/', $digits)) return '+38' . $digits;
    if (preg_match('/^380\d{9}$/', $digits)) return '+' . $digits;
    if (preg_match('/^\d{10,15}$/', $digits)) return '+' . $digits;
    return null;
}

/** File-based limit: at most $max hits per key in WINDOW_SECONDS. */
function rate_limited(string $key, int $max): bool
{
    $dir = sys_get_temp_dir() . '/gd-leads';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/' . hash('sha256', $key);
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = array_filter(array_map('intval', explode(',', (string) file_get_contents($file))), fn($t) => $t > $now - WINDOW_SECONDS);
    }
    if (count($hits) >= $max) return true;
    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return false;
}

function send_telegram(array $config, string $text): bool
{
    $token = trim((string) ($config['telegram_bot_token'] ?? ''));
    $chats = array_filter(array_map('trim', explode(',', (string) ($config['telegram_chat_id'] ?? ''))));
    if ($token === '' || !$chats) return false;
    $api = rtrim((string) ($config['telegram_api'] ?? 'https://api.telegram.org'), '/');
    $ok = false;
    foreach ($chats as $chat) {
        $payload = json_encode(['chat_id' => $chat, 'text' => $text, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE);
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 10,
            'ignore_errors' => true,
        ]]);
        $result = @file_get_contents("$api/bot$token/sendMessage", false, $context);
        $decoded = is_string($result) ? json_decode($result, true) : null;
        if (is_array($decoded) && ($decoded['ok'] ?? false)) $ok = true;
        else error_log('telegram failed: ' . (is_string($result) ? $result : 'no response'));
    }
    return $ok;
}

function send_mail(array $config, string $subject, string $html): bool
{
    $to = trim((string) ($config['mail_to'] ?? ''));
    $from = trim((string) ($config['mail_from'] ?? ''));
    if ($to === '' || !function_exists('mail')) return false;
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
    ];
    if ($from !== '') $headers[] = 'From: =?UTF-8?B?' . base64_encode('Сайт GeniusDev') . "?= <$from>";
    $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $html, implode("\r\n", $headers));
    if (!$ok) error_log('mail() failed');
    return $ok;
}

// ---------------------------------------------------------------------------

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    error_log('api/config.php is missing — copy config.example.php');
    respond(500, ['ok' => false, 'error' => 'Сервіс заявок не налаштовано. Зателефонуйте нам, будь ласка.']);
}
$config = require $configFile;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') respond(405, ['ok' => false, 'error' => 'Method not allowed']);

// Same-site only.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$siteUrl = (string) ($config['site_url'] ?? '');
if ($origin !== '' && $siteUrl !== '') {
    $allowed = strtolower((string) parse_url($siteUrl, PHP_URL_HOST));
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $strip = fn(string $h) => preg_replace('/^www\./', '', $h);
    if ($strip($host) !== $strip($allowed)) respond(403, ['ok' => false, 'error' => 'Forbidden']);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1) ?: '';
if (strlen($raw) > MAX_BODY_BYTES) respond(413, ['ok' => false, 'error' => 'Too large']);
$body = json_decode($raw, true);
if (!is_array($body)) respond(400, ['ok' => false, 'error' => 'Invalid JSON']);

// Bots: hidden "website" field, or submitted impossibly fast. Answer "ok" so they don't learn.
$startedAt = is_numeric($body['startedAt'] ?? null) ? (float) $body['startedAt'] / 1000 : null;
if (clean($body['website'] ?? '', 200) !== '' || ($startedAt !== null && microtime(true) - $startedAt < MIN_FILL_SECONDS)) {
    respond(200, ['ok' => true]);
}

$name = clean($body['name'] ?? '', 100);
$phone = normalize_phone(clean($body['phone'] ?? '', 30));
$message = clean($body['message'] ?? '', 2000);
$slug = clean($body['serviceSlug'] ?? '', 120);
$serviceTitle = clean($body['serviceTitle'] ?? '', 150);
$sourcePage = clean($body['sourcePage'] ?? '', 200);

$errors = [];
if ($name === '') $errors['name'] = "Вкажіть ім'я";
if ($phone === null) $errors['phone'] = 'Вкажіть номер телефону, наприклад 067 123 45 67';
if ($slug !== '' && !preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) $errors['serviceSlug'] = 'Невідома послуга';
if ($errors) respond(422, ['ok' => false, 'errors' => $errors]);

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
if (rate_limited("phone:$phone", MAX_PER_PHONE) || ($ip !== '' && rate_limited("ip:$ip", MAX_PER_IP))) {
    respond(429, ['ok' => false, 'error' => 'Заявку вже отримано. Ми скоро зателефонуємо.']);
}

$e = fn(string $s) => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$service = $serviceTitle !== '' ? $serviceTitle : ($slug !== '' ? $slug : 'не вказано');

$lines = ['<b>Нова заявка з сайту</b>', '👤 ' . $e($name), "📞 <a href=\"tel:$phone\">$phone</a>", '🛠 ' . $e($service)];
if ($message !== '') $lines[] = '💬 ' . $e($message);
if ($sourcePage !== '') $lines[] = '📄 ' . $e($sourcePage);
$telegramOk = send_telegram($config, implode("\n", $lines));

$rows = ["Ім'я" => $name, 'Телефон' => $phone, 'Послуга' => $service, 'Повідомлення' => $message ?: '—', 'Сторінка' => $sourcePage ?: '—'];
$html = '<h2 style="font-family:sans-serif">Нова заявка з сайту</h2><table style="font-family:sans-serif;font-size:15px">';
foreach ($rows as $k => $v) {
    $html .= '<tr><td style="padding:6px 16px 6px 0;color:#666">' . $e($k) . '</td><td style="padding:6px 0">' . nl2br($e($v)) . '</td></tr>';
}
$html .= '</table>';
$mailOk = send_mail($config, "Заявка: $name, $phone", $html);

if (!$telegramOk && !$mailOk) {
    error_log('lead lost: neither Telegram nor mail accepted it');
    respond(502, ['ok' => false, 'error' => 'Не вдалося надіслати заявку. Зателефонуйте нам, будь ласка.']);
}
respond(200, ['ok' => true]);
