import { Injectable } from '@angular/core';
import type { Lead, LeadRequest } from './models';
import { DEMO_MODE } from './env';
import { demoStore } from './data/demo-store';

export type LeadResult =
  | { ok: true; demo?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

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
      return DEMO_MODE ? this.saveDemo(payload) : { ok: false, message: 'Немає зʼєднання. Перевірте інтернет або зателефонуйте нам.' };
    }

    // No API on this host (local dev or static preview): keep the lead in demo storage.
    if (res.status === 404 || res.status === 405) {
      return DEMO_MODE ? this.saveDemo(payload) : { ok: false, message: 'Сервіс заявок недоступний. Зателефонуйте нам, будь ласка.' };
    }

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

  private saveDemo(p: LeadRequest): LeadResult {
    const service = p.serviceSlug ? demoStore.services().find((s) => s.slug === p.serviceSlug) : undefined;
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: p.name,
      phone: p.phone,
      message: p.message,
      service_id: service?.id ?? null,
      service_title: service?.title ?? null,
      source_page: p.sourcePage,
      status: 'new',
      admin_note: '',
      created_at: new Date().toISOString(),
    };
    demoStore.saveLeads([lead, ...demoStore.leads()]);
    return { ok: true, demo: true };
  }
}
