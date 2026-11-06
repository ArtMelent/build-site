# GeniusDev — сайт бурильної компанії

Сайт компанії з горизонтального направленого буріння: каталог послуг і форма заявки.

- **Angular 22** (standalone, signals, zoneless); усі сторінки пререндеряться в HTML під час збірки
- **Vercel** — хостинг і функція `/api/lead`, яка пересилає заявки в Telegram і на пошту (Resend)
- Без бази даних: контент послуг лежить у `src/app/core/data/services.json`

## Швидкий старт

Потрібен Node.js 22.22+ або 24.15+.

```bash
npm ci
npm start          # http://localhost:4200
```

## Команди

| Команда | Що робить |
|---|---|
| `npm start` | Локальний сервер розробки |
| `npm run build` | Продакшн-збірка → `dist/mysite/browser` (+ `sitemap.xml`, `robots.txt`) |
| `npm test` | Тести прийому заявок |

## Де що лежить

```
api/lead.ts                     Vercel Function: POST /api/lead
server/lead.ts                  Логіка заявок: валідація, антиспам, ліміти, Telegram, Resend
src/app/core/data/services.json Послуги: тексти (Markdown), ціни, фото, порядок
src/app/core/site.ts            Телефони, пошта, назва компанії
src/app/site/                   Сторінки: головна, послуга, контакти, форма заявки
public/                         Шрифт Oswald, favicon
src/assets/                     Картинки й відео (WebP / H.264)
```

## Деплой і редагування контенту

Покрокова інструкція українською — **[DEPLOY.md](DEPLOY.md)**.
