import { Injectable } from '@angular/core';
import type { LeadRequest } from './models';

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
      return { ok: false, message: 'Немає зʼєднання. Перевірте інтернет або зателефонуйте нам.' };
    }

    // No API on this host (local `npm start` or a static preview): nothing to send to.
    if (res.status === 404 || res.status === 405) return { ok: true, preview: true };

    let body: { ok?: boolean; error?: string; errors?: Record<string, string> } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error page */
    }
    if (res.ok && body.ok) return { ok: true };
    return {
      ok: false,
      message: body.error ?? 'Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.',
      fieldErrors: body.errors,
    };
  }
}
