<?php
// Copy this file to config.php (same folder) on the server and fill in your values.
// config.php is never sent to visitors: PHP files are executed, and .htaccess blocks it too.
return [
    // Your site address, used to reject submissions sent from other websites.
    'site_url' => 'https://your-domain.com.ua',

    // Telegram: token from @BotFather and the chat id (several — separated by commas).
    'telegram_bot_token' => '',
    'telegram_chat_id' => '',

    // Email via the hosting's mail(). Leave 'mail_to' empty to turn email off.
    // 'mail_from' should be an address on your domain, otherwise mail may land in spam.
    'mail_to' => 'geniusdevgnb@gmail.com',
    'mail_from' => 'zayavky@your-domain.com.ua',
];
