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
}

export interface LeadRequest {
  name: string;
  phone: string;
  message: string;
  serviceSlug: string | null;
  serviceTitle: string | null;
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
