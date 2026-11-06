import type { Lead, Service } from '../models';
import { SEED_SERVICES } from './seed';

/**
 * Demo-mode storage: everything lives in this browser's localStorage.
 * Lets you click through the site and admin panel before Supabase is connected.
 */
const KEY_SERVICES = 'gd-demo-services';
const KEY_LEADS = 'gd-demo-leads';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — demo only */
  }
}

export const demoStore = {
  services(): Service[] {
    return read<Service[]>(KEY_SERVICES, SEED_SERVICES).slice().sort((a, b) => a.sort_order - b.sort_order);
  },
  saveServices(list: Service[]): void {
    write(KEY_SERVICES, list);
  },
  leads(): Lead[] {
    return read<Lead[]>(KEY_LEADS, []).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  saveLeads(list: Lead[]): void {
    write(KEY_LEADS, list);
  },
  reset(): void {
    try {
      globalThis.localStorage?.removeItem(KEY_SERVICES);
      globalThis.localStorage?.removeItem(KEY_LEADS);
    } catch {
      /* ignore */
    }
  },
};
