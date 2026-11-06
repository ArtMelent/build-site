import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ENV } from './env';
import { SITE } from './site';

export interface SeoData {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  jsonLd?: object | object[];
  noindex?: boolean;
}

/** Sets title, description, canonical, Open Graph and JSON-LD for the current page (also during prerender). */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  set(data: SeoData): void {
    const description = data.description || SITE.defaultDescription;
    const url = ENV.siteUrl ? `${ENV.siteUrl}${data.path}` : data.path;
    const image = data.image ? this.absolute(data.image) : this.absolute('assets/og-image.jpg');

    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: data.noindex ? 'noindex, nofollow' : 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'uk_UA' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE.name });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;

    this.doc.head.querySelectorAll('script[data-seo]').forEach((el) => el.remove());
    const blocks = data.jsonLd ? (Array.isArray(data.jsonLd) ? data.jsonLd : [data.jsonLd]) : [];
    for (const block of blocks) {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', '');
      script.textContent = JSON.stringify(block).replace(/</g, '\\u003c');
      this.doc.head.appendChild(script);
    }
  }

  absolute(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return ENV.siteUrl ? `${ENV.siteUrl}${path}` : path;
  }

  /** schema.org data describing the company. */
  organization(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      name: SITE.name,
      description: SITE.defaultDescription,
      ...(ENV.siteUrl ? { url: ENV.siteUrl, logo: `${ENV.siteUrl}/assets/logo.svg` } : {}),
      telephone: SITE.phones.map((p) => p.href.replace('tel:', '')),
      email: SITE.email,
      areaServed: 'UA',
      foundingDate: String(SITE.foundedYear),
    };
  }
}
