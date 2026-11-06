export interface Service {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  intro: string;
  body: string;
  highlights: string[];
  price_from: number | null;
  price_unit: string;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ServiceDraft = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

export type LeadStatus = 'new' | 'in_progress' | 'done' | 'spam';

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Нова' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'done', label: 'Виконана' },
  { value: 'spam', label: 'Спам' },
];

export interface Lead {
  id: string;
  name: string;
  phone: string;
  message: string;
  service_id: string | null;
  service_title: string | null;
  source_page: string | null;
  status: LeadStatus;
  admin_note: string;
  created_at: string;
  updated_at?: string;
}

export interface LeadRequest {
  name: string;
  phone: string;
  message: string;
  serviceSlug: string | null;
  sourcePage: string | null;
  /** Honeypot: must stay empty. */
  website: string;
  /** When the form was shown, used to filter out bots. */
  startedAt: number;
}

export function formatPrice(s: Pick<Service, 'price_from' | 'price_unit'>): string | null {
  if (s.price_from == null) return null;
  return `від ${s.price_from.toLocaleString('uk-UA')} ${s.price_unit || 'грн'}`;
}
