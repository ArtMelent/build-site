import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { LeadDialogComponent } from '../lead-dialog/lead-dialog';
import { LeadDialogService } from '../../core/lead-dialog.service';
import { IconComponent } from '../../core/icon';
import { SITE } from '../../core/site';

@Component({
  selector: 'app-site-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LeadDialogComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#main">Перейти до вмісту</a>
    <app-header id="top" />
    <main id="main"><router-outlet /></main>
    <app-footer />
    <app-lead-dialog />

    <!-- Always-visible actions on phones -->
    <div class="mobile-bar">
      <a class="btn btn--ghost" [href]="site.phones[0].href"><app-icon name="phone" /> Подзвонити</a>
      <button type="button" class="btn" (click)="dialog.show()"><app-icon name="form" /> Заявка</button>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
    .skip { position: absolute; left: 8px; top: -60px; z-index: 100; padding: 10px 16px; background: var(--ink); color: #fff; border-radius: var(--radius); }
    .skip:focus { top: 8px; }
    .mobile-bar { display: none; }
    @media (max-width: 560px) {
      .mobile-bar {
        position: fixed; inset: auto 0 0 0; z-index: 40;
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
        background: rgba(255,255,255,0.97); backdrop-filter: blur(8px);
        border-top: 1px solid var(--line); box-shadow: 0 -6px 20px rgba(26,24,24,0.06);
      }
      .mobile-bar .btn { min-height: 46px; padding-inline: 12px; }
      .mobile-bar .btn--ghost { background: #fff; }
    }
  `,
})
export class SiteLayout {
  protected readonly site = SITE;
  protected readonly dialog = inject(LeadDialogService);
}
