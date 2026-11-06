import { Injectable } from '@angular/core';
import type { LeadRequest } from './models';
import { ENV } from './env';

/**
 * A build without SITE_URL (local `npm start`, the design preview) has no form handler.
 * There the form only pretends to send. Real builds always set SITE_URL, so a missing
 * handler is reported as an error instead of silently losing the request.
 */
const IS_PREVIEW = !ENV.siteUrl;

export type LeadResult =
  | { ok: true; preview?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** Sends the request form to /api/lead (Cloudflare Pages Function or PHP script), which forwards it to Telegram and email. */
@Injectable({ providedIn: 'root' })
export class LeadService {
  async submit(payload: LeadRequest): Promise<LeadResult> {
    let res: Response;
    try {
      res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      if (IS_PREVIEW) return { ok: true, preview: true };
      return { ok: false, message: 'Немає зʼєднання. Перевірте інтернет або зателефонуйте нам.' };
    }

    let body: { ok?: boolean; error?: string; errors?: Record<string, string> } | null = null;
    try {
      body = await res.json();
    } catch {
      /* not our handler: an HTML error page */
    }
    if (!body && IS_PREVIEW) return { ok: true, preview: true };
    if (!body && (res.status === 404 || res.status === 405)) {
      console.error('/api/lead is missing on this host — see DEPLOY.md');
      return { ok: false, message: 'Сервіс заявок тимчасово недоступний. Зателефонуйте нам, будь ласка.' };
    }
    body ??= {};
    if (res.ok && body.ok) return { ok: true };
    return {
      ok: false,
      message: body.error ?? 'Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.',
      fieldErrors: body.errors,
    };
  }
}
