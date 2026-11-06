import { Injectable, PLATFORM_ID, TransferState, computed, inject, makeStateKey, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Service } from '../models';
import { DEMO_MODE, ENV } from '../env';
import { SEED_SERVICES } from './seed';
import { demoStore } from './demo-store';

const SERVICES_KEY = makeStateKey<Service[]>('services');
const COLUMNS =
  'id,slug,title,short_description,intro,body,highlights,price_from,price_unit,image_url,seo_title,seo_description,sort_order,is_published,updated_at';

/** Fetches published services from Supabase over plain REST (no SDK on public pages). */
export async function fetchPublishedServices(): Promise<Service[]> {
  if (DEMO_MODE) return SEED_SERVICES.filter((s) => s.is_published);
  const url = `${ENV.supabaseUrl}/rest/v1/services?select=${COLUMNS}&is_published=eq.true&order=sort_order.asc,title.asc`;
  const res = await fetch(url, {
    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${ENV.supabaseAnonKey}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as Service[];
}

/**
 * Public catalogue of services.
 * At build time the list is fetched and embedded in each prerendered page (TransferState),
 * so pages show content immediately; in the browser it is then refreshed in the background,
 * so edits made in the admin panel appear without a redeploy.
 */
@Injectable({ providedIn: 'root' })
export class SiteDataService {
  private readonly state = inject(TransferState);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly services = signal<Service[]>(this.state.get(SERVICES_KEY, [] as Service[]));
  readonly loaded = signal(this.services().length > 0);
  readonly error = signal(false);

  private loading: Promise<void> | null = null;
  private refreshed = false;

  readonly bySlug = computed(() => new Map(this.services().map((s) => [s.slug, s])));

  /** Resolves once services are available (used by the router before rendering). */
  ensureLoaded(): Promise<void> {
    if (this.loaded()) {
      if (this.isBrowser && !this.refreshed) {
        this.refreshed = true;
        // Pick up admin edits made after this page was built, without blocking the render.
        setTimeout(() => void this.load(), 0);
      }
      return Promise.resolve();
    }
    return this.load();
  }

  private load(): Promise<void> {
    this.loading ??= (async () => {
      try {
        const list = DEMO_MODE && this.isBrowser ? demoStore.services().filter((s) => s.is_published) : await fetchPublishedServices();
        this.services.set(list);
        this.error.set(false);
        if (!this.isBrowser) this.state.set(SERVICES_KEY, list);
      } catch (e) {
        console.error('Could not load services', e);
        if (!this.loaded()) {
          // Fall back to built-in content so the site is never empty.
          this.services.set(SEED_SERVICES.filter((s) => s.is_published));
          this.error.set(true);
        }
      } finally {
        this.loaded.set(true);
        this.refreshed = true;
        this.loading = null;
      }
    })();
    return this.loading;
  }
}
