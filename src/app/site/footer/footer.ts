import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteDataService } from '../../core/data/site-data.service';
import { IconComponent } from '../../core/icon';
import { SITE } from '../../core/site';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container grid">
      <div class="brand">
        <img src="assets/logo.svg" alt="GeniusDev" width="160" height="51" class="logo" />
        <p>Горизонтальне направлене буріння та безтраншейне прокладання комунікацій для житлових і промислових об'єктів.</p>
      </div>

      <nav aria-label="Послуги">
        <p class="title">Послуги</p>
        <ul>
          @for (s of data.services(); track s.id) {
            <li><a [routerLink]="['/services', s.slug]">{{ s.title }}</a></li>
          }
        </ul>
      </nav>

      <nav aria-label="Компанія">
        <p class="title">Компанія</p>
        <ul>
          <li><a routerLink="/" fragment="process">Як ми працюємо</a></li>
          <li><a routerLink="/" fragment="projects">Проєкти</a></li>
          <li><a routerLink="/" fragment="faq">Питання й відповіді</a></li>
          <li><a routerLink="/contacts">Контакти</a></li>
        </ul>
      </nav>

      <div>
        <p class="title">Контакти</p>
        <ul class="contacts">
          @for (p of site.phones; track p.href) {
            <li><a [href]="p.href"><app-icon name="phone" [size]="18" /> {{ p.display }}</a></li>
          }
          <li><a [href]="'mailto:' + site.email"><app-icon name="mail" [size]="18" /> {{ site.email }}</a></li>
        </ul>
      </div>
    </div>
    <div class="container bottom">
      <p>© {{ site.foundedYear }}–{{ year }} {{ site.legalName }}</p>
      <a href="#top" (click)="toTop($event)">Нагору ↑</a>
    </div>
  `,
  styles: `
    :host { display: block; background: var(--bg-soft); color: var(--muted); border-top: 1px solid var(--line); padding-top: clamp(48px, 6vw, 72px); font-size: 0.95rem; }
    .grid { display: grid; grid-template-columns: 1.3fr 1.3fr 1fr 1.1fr; gap: 40px; padding-bottom: 48px; }
    .logo { width: 160px; margin-bottom: 18px; }
    .brand p { max-width: 34ch; }
    .title { font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink); font-size: 1rem; margin-bottom: 14px; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    a { color: var(--text); text-decoration: none; transition: color 0.2s; }
    a:hover { color: var(--red); }
    .contacts a { display: inline-flex; align-items: center; gap: 10px; }
    .contacts app-icon { color: var(--red); }
    .bottom { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding-block: 22px; border-top: 1px solid var(--line); font-size: 0.85rem; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .grid { grid-template-columns: 1fr; gap: 28px; } :host { padding-bottom: 72px; } }
  `,
})
export class FooterComponent {
  protected readonly site = SITE;
  protected readonly data = inject(SiteDataService);
  protected readonly year = new Date().getFullYear();

  protected toTop(e: Event): void {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}
