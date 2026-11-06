import { InjectionToken } from '@angular/core';
import type { Lead, LeadStatus, Service, ServiceDraft } from '../core/models';
import { DEMO_MODE } from '../core/env';
import { DemoAdminApi } from './demo-admin-api';
import { SupabaseAdminApi } from './supabase-admin-api';

/** Everything the admin panel needs from the backend. Two implementations: Supabase and demo (localStorage). */
export interface AdminApi {
  readonly demo: boolean;
  currentEmail(): Promise<string | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** After following the reset link: sets a new password for the signed-in user. */
  updatePassword(password: string): Promise<void>;
  isAdmin(): Promise<boolean>;

  listServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(draft: ServiceDraft): Promise<Service>;
  updateService(id: string, patch: Partial<ServiceDraft>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  /** Uploads an image (already converted to WebP) and returns its public URL. */
  uploadImage(file: Blob, name: string): Promise<string>;

  listLeads(): Promise<Lead[]>;
  updateLead(id: string, patch: Partial<Pick<Lead, 'status' | 'admin_note'>>): Promise<void>;
  deleteLead(id: string): Promise<void>;
}

export const ADMIN_API = new InjectionToken<AdminApi>('AdminApi', {
  providedIn: 'root',
  factory: () => (DEMO_MODE ? new DemoAdminApi() : new SupabaseAdminApi()),
});

export class AdminError extends Error {}

/** Turns backend errors into messages a site owner can act on. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid login credentials/i.test(msg)) return 'Невірна пошта або пароль.';
  if (/email not confirmed/i.test(msg)) return 'Пошту не підтверджено. Перевірте лист від Supabase.';
  if (/duplicate key.*slug|services_slug_key/i.test(msg)) return 'Послуга з такою адресою (slug) вже існує. Змініть адресу.';
  if (/services_slug_check/i.test(msg)) return 'Адреса (slug) може містити лише латинські літери, цифри й дефіси.';
  if (/row-level security|permission denied|JWT/i.test(msg)) return 'Немає прав на цю дію. Увійдіть знову під акаунтом адміністратора.';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Немає зʼєднання з сервером. Перевірте інтернет і спробуйте ще раз.';
  if (/payload too large|exceeded the maximum allowed size/i.test(msg)) return 'Файл завеликий. Максимум 5 МБ.';
  return msg || 'Щось пішло не так. Спробуйте ще раз.';
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  done: 'Виконана',
  spam: 'Спам',
};
