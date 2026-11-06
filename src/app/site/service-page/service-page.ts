import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteDataService } from '../../core/data/site-data.service';
import { LeadDialogService } from '../../core/lead-dialog.service';
import { SeoService } from '../../core/seo.service';
import { formatPrice } from '../../core/models';
import { renderMarkdown } from '../../core/markdown';
import { IconComponent } from '../../core/icon';
import { RevealDirective } from '../../core/reveal.directive';
import { SITE } from '../../core/site';
import { ServiceCardComponent } from '../service-card/service-card';
import { LeadFormComponent } from '../lead-form/lead-form';
import { NotFoundPage } from '../not-found/not-found';

@Component({
  selector: 'app-service-page',
  imports: [RouterLink, IconComponent, RevealDirective, ServiceCardComponent, LeadFormComponent, NotFoundPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-page.html',
  styleUrl: './service-page.scss',
})
export class ServicePage {
  /** The :slug route param (bound by withComponentInputBinding). */
  readonly slug = input<string>('');

  protected readonly site = SITE;
  private readonly data = inject(SiteDataService);
  protected readonly dialog = inject(LeadDialogService);
  private readonly seo = inject(SeoService);

  protected readonly service = computed(() => this.data.bySlug().get(this.slug()) ?? null);
  protected readonly price = computed(() => (this.service() ? formatPrice(this.service()!) : null));
  protected readonly html = computed(() => renderMarkdown(this.service()?.body ?? ''));
  protected readonly others = computed(() => this.data.services().filter((s) => s.slug !== this.slug()).slice(0, 3));

  constructor() {
    effect(() => {
      const s = this.service();
      if (!s) {
        this.seo.set({ title: 'Сторінку не знайдено — GeniusDev', path: `/services/${this.slug()}`, noindex: true });
        return;
      }
      const path = `/services/${s.slug}`;
      this.seo.set({
        title: s.seo_title || `${s.title} — GeniusDev`,
        description: s.seo_description || s.short_description,
        path,
        image: s.image_url,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: s.title,
            description: s.seo_description || s.short_description,
            serviceType: s.title,
            areaServed: 'UA',
            provider: { '@type': 'HomeAndConstructionBusiness', name: SITE.name, telephone: SITE.phones[0].href.replace('tel:', '') },
            ...(s.price_from != null
              ? { offers: { '@type': 'Offer', priceCurrency: 'UAH', price: s.price_from, priceSpecification: { '@type': 'PriceSpecification', minPrice: s.price_from, priceCurrency: 'UAH' } } }
              : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Головна', item: this.seo.absolute('/') },
              { '@type': 'ListItem', position: 2, name: 'Послуги', item: this.seo.absolute('/#services') },
              { '@type': 'ListItem', position: 3, name: s.title, item: this.seo.absolute(path) },
            ],
          },
        ],
      });
    });
  }
}
