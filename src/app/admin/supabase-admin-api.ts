import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Lead, Service, ServiceDraft } from '../core/models';
import { ENV } from '../core/env';
import type { AdminApi } from './admin-api';

const BUCKET = 'service-images';

export class SupabaseAdminApi implements AdminApi {
  readonly demo = false;
  private client?: SupabaseClient;

  private get db(): SupabaseClient {
    this.client ??= createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'gd-admin-auth' },
    });
    return this.client;
  }

  private static check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  async currentEmail(): Promise<string | null> {
    const { data } = await this.db.auth.getSession();
    return data.session?.user.email ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.db.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/admin/login?reset=1`,
    });
    if (error) throw new Error(error.message);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.db.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }

  async isAdmin(): Promise<boolean> {
    const { data: session } = await this.db.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) return false;
    // RLS lets a user see the admins table only if they are in it.
    const { data, error } = await this.db.from('admins').select('user_id').eq('user_id', uid).maybeSingle();
    return !error && !!data;
  }

  async listServices(): Promise<Service[]> {
    return SupabaseAdminApi.check(
      await this.db.from('services').select('*').order('sort_order').order('title'),
    ) as Service[];
  }

  async getService(id: string): Promise<Service | null> {
    return SupabaseAdminApi.check(await this.db.from('services').select('*').eq('id', id).maybeSingle()) as Service | null;
  }

  async createService(draft: ServiceDraft): Promise<Service> {
    return SupabaseAdminApi.check(await this.db.from('services').insert(draft).select().single()) as Service;
  }

  async updateService(id: string, patch: Partial<ServiceDraft>): Promise<Service> {
    return SupabaseAdminApi.check(await this.db.from('services').update(patch).eq('id', id).select().single()) as Service;
  }

  async deleteService(id: string): Promise<void> {
    SupabaseAdminApi.check(await this.db.from('services').delete().eq('id', id));
  }

  async uploadImage(file: Blob, name: string): Promise<string> {
    const path = `${name}-${Date.now()}.webp`;
    const { error } = await this.db.storage.from(BUCKET).upload(path, file, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return this.db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async listLeads(): Promise<Lead[]> {
    return SupabaseAdminApi.check(
      await this.db
        .from('leads')
        .select('id,name,phone,message,service_id,service_title,source_page,status,admin_note,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(500),
    ) as Lead[];
  }

  async updateLead(id: string, patch: Partial<Pick<Lead, 'status' | 'admin_note'>>): Promise<void> {
    SupabaseAdminApi.check(await this.db.from('leads').update(patch).eq('id', id));
  }

  async deleteLead(id: string): Promise<void> {
    SupabaseAdminApi.check(await this.db.from('leads').delete().eq('id', id));
  }
}
