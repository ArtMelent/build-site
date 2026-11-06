import type { Lead, Service, ServiceDraft } from '../core/models';
import { demoStore } from '../core/data/demo-store';
import type { AdminApi } from './admin-api';

const SESSION_KEY = 'gd-demo-admin';
const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));

/** Admin backend that keeps everything in this browser — for trying the panel before Supabase is set up. */
export class DemoAdminApi implements AdminApi {
  readonly demo = true;

  async currentEmail(): Promise<string | null> {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  async signIn(email: string): Promise<void> {
    await wait();
    try {
      sessionStorage.setItem(SESSION_KEY, email || 'demo@geniusdev');
    } catch {
      /* ignore */
    }
  }

  async signOut(): Promise<void> {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  async sendPasswordReset(): Promise<void> {
    await wait();
  }

  async updatePassword(): Promise<void> {
    await wait();
  }

  async isAdmin(): Promise<boolean> {
    return !!(await this.currentEmail());
  }

  async listServices(): Promise<Service[]> {
    await wait();
    return demoStore.services();
  }

  async getService(id: string): Promise<Service | null> {
    return demoStore.services().find((s) => s.id === id) ?? null;
  }

  async createService(draft: ServiceDraft): Promise<Service> {
    await wait();
    const list = demoStore.services();
    if (list.some((s) => s.slug === draft.slug)) throw new Error('duplicate key value violates unique constraint "services_slug_key"');
    const now = new Date().toISOString();
    const created: Service = { ...draft, id: crypto.randomUUID(), created_at: now, updated_at: now };
    demoStore.saveServices([...list, created]);
    return created;
  }

  async updateService(id: string, patch: Partial<ServiceDraft>): Promise<Service> {
    await wait();
    const list = demoStore.services();
    if (patch.slug && list.some((s) => s.slug === patch.slug && s.id !== id))
      throw new Error('duplicate key value violates unique constraint "services_slug_key"');
    const updated = list.map((s) => (s.id === id ? { ...s, ...patch, updated_at: new Date().toISOString() } : s));
    demoStore.saveServices(updated);
    return updated.find((s) => s.id === id)!;
  }

  async deleteService(id: string): Promise<void> {
    await wait();
    demoStore.saveServices(demoStore.services().filter((s) => s.id !== id));
  }

  async uploadImage(file: Blob): Promise<string> {
    // Demo: keep the image inline in the browser.
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async listLeads(): Promise<Lead[]> {
    await wait();
    return demoStore.leads();
  }

  async updateLead(id: string, patch: Partial<Pick<Lead, 'status' | 'admin_note'>>): Promise<void> {
    demoStore.saveLeads(demoStore.leads().map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async deleteLead(id: string): Promise<void> {
    demoStore.saveLeads(demoStore.leads().filter((l) => l.id !== id));
  }
}
