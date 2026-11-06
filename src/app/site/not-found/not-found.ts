import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { SiteDataService } from '../../core/data/site-data.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container box">
        <p class="code">404</p>
        <h1>Сторінку не знайдено</h1>
        <p class="lead-text">Можливо, посилання застаріло. Перегляньте наші послуги або поверніться на головну.</p>
        <ul class="links">
          @for (s of data.services(); track s.id) {
            <li><a [routerLink]="['/services', s.slug]">{{ s.title }}</a></li>
          }
        </ul>
        <a class="btn" routerLink="/">На головну</a>
      </div>
    </section>
  `,
  styles: `
    .box { display: grid; gap: 18px; justify-items: start; max-width: 760px; }
    .code { font-family: var(--font-display); font-size: 5rem; line-height: 1; color: var(--red); }
    .links { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
    .links a { display: inline-block; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); text-decoration: none; }
    .links a:hover { border-color: var(--red); color: var(--red); }
  `,
})
export class NotFoundPage {
  protected readonly data = inject(SiteDataService);

  constructor() {
    inject(SeoService).set({ title: 'Сторінку не знайдено — GeniusDev', path: '/404', noindex: true });
  }
}
