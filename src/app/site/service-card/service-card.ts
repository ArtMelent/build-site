import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatPrice, type Service } from '../../core/models';
import { IconComponent } from '../../core/icon';

@Component({
  selector: 'app-service-card',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="['/services', service().slug]">
      <div class="media">
        @if (service().image_url) {
          <img [src]="service().image_url" [alt]="service().title" loading="lazy" width="600" height="400" />
        }
        @if (price()) { <span class="price">{{ price() }}</span> }
      </div>
      <div class="body">
        <h3>{{ service().title }}</h3>
        <p>{{ service().short_description }}</p>
        <span class="more">Детальніше <app-icon name="arrow" [size]="18" /></span>
      </div>
    </a>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .card {
      height: 100%; display: flex; flex-direction: column;
      background: #fff; border: 1px solid var(--line); border-radius: var(--radius-lg); overflow: hidden;
      color: inherit; text-decoration: none;
      transition: transform 0.35s var(--ease), box-shadow 0.35s var(--ease), border-color 0.35s;
    }
    .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: transparent; }
    .media { position: relative; aspect-ratio: 3 / 2; background: var(--bg-soft); overflow: hidden; }
    .media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--ease); }
    .card:hover .media img { transform: scale(1.05); }
    .price {
      position: absolute; left: 14px; bottom: 14px;
      padding: 6px 12px; border-radius: 999px;
      background: rgba(255,255,255,0.95); color: var(--ink);
      font-family: var(--font-display); font-weight: 500; letter-spacing: 0.03em; font-size: 0.95rem;
    }
    .body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 22px 22px 24px; }
    h3 { font-size: 1.3rem; }
    p { color: var(--muted); font-size: 0.97rem; flex: 1; }
    .more {
      display: inline-flex; align-items: center; gap: 8px; margin-top: 6px;
      font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; color: var(--red); font-weight: 500;
    }
    .more app-icon { transition: transform 0.3s var(--ease); }
    .card:hover .more app-icon { transform: translateX(5px); }
  `,
})
export class ServiceCardComponent {
  readonly service = input.required<Service>();
  protected readonly price = computed(() => formatPrice(this.service()));
}
