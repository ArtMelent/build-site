import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { IconComponent } from '../../core/icon';
import { SITE } from '../../core/site';
import { LeadFormComponent } from '../lead-form/lead-form';

@Component({
  selector: 'app-contacts',
  imports: [IconComponent, LeadFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container grid">
        <div class="info">
          <p class="eyebrow">Звʼяжіться з нами</p>
          <h1>Контакти</h1>
          <p class="lead-text">Зателефонуйте або залиште заявку — порадимо, як краще прокласти комунікації на вашому обʼєкті, і домовимося про безкоштовний виїзд спеціаліста.</p>

          <ul class="cards">
            @for (p of site.phones; track p.href) {
              <li>
                <a [href]="p.href">
                  <span class="cards__icon"><app-icon name="phone" /></span>
                  <span><small>Телефон</small>{{ p.display }}</span>
                </a>
              </li>
            }
            <li>
              <a [href]="'mailto:' + site.email">
                <span class="cards__icon"><app-icon name="mail" /></span>
                <span><small>Пошта</small>{{ site.email }}</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="form-card">
          <h2>Залишити заявку</h2>
          <p class="sub">Передзвонимо й відповімо на запитання.</p>
          <app-lead-form submitLabel="Надіслати заявку" />
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 6vw, 80px); align-items: start; }
    .info { display: grid; gap: 20px; }
    .info .eyebrow { margin: 0; }
    .cards { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 12px; }
    .cards a {
      display: flex; align-items: center; gap: 16px; padding: 18px 20px;
      border: 1px solid var(--line); border-radius: var(--radius-lg);
      color: var(--ink); text-decoration: none; font-size: 1.15rem; font-weight: 500;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.25s var(--ease);
    }
    .cards a:hover { border-color: transparent; box-shadow: var(--shadow); transform: translateY(-2px); }
    .cards small { display: block; font-size: 0.8rem; font-weight: 400; color: var(--muted); }
    .cards__icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--radius); background: var(--red-tint); color: var(--red); flex: none; }
    .form-card { padding: clamp(24px, 4vw, 40px); border-radius: var(--radius-lg); background: #fff; box-shadow: var(--shadow-lg); border-top: 4px solid var(--red); }
    .form-card h2 { font-size: 1.8rem; }
    .sub { color: var(--muted); margin: 6px 0 20px; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class ContactsPage {
  protected readonly site = SITE;

  constructor() {
    inject(SeoService).set({
      title: 'Контакти — GeniusDev',
      description: `Телефони ${SITE.phones.map((p) => p.display).join(', ')}, пошта ${SITE.email}. Безкоштовний виїзд спеціаліста й кошторис.`,
      path: '/contacts',
    });
  }
}
