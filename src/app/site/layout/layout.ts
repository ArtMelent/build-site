import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
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

    <!-- Popover so it shows above the request dialog too (both live in the browser's top layer). -->
    <div class="copied" popover="manual" role="status" #copiedEl>
      <app-icon name="check" [stroke]="2.4" />
      <span>
        @if (copiedKind() === 'mail') {
          Пошту <strong>{{ copied() }}</strong>
          @if (copyOk()) { скопійовано. Вставте її в поле «Кому» свого листа. } @else { — напишіть нам на цю адресу. }
        } @else {
          Номер <strong>{{ copied() }}</strong>
          @if (copyOk()) { скопійовано. Наберіть його з телефона. } @else { — наберіть його з телефона. }
        }
      </span>
    </div>

    <!-- Always-visible actions on phones -->
    <div class="mobile-bar">
      <a class="btn btn--ghost" [href]="site.phones[0].href"><app-icon name="phone" /> Подзвонити</a>
      <button type="button" class="btn" (click)="dialog.show()"><app-icon name="form" /> Заявка</button>
    </div>
  `,
  host: { '(document:click)': 'onDocumentClick($event)' },
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
    .skip { position: absolute; left: 8px; top: -60px; z-index: 100; padding: 10px 16px; background: var(--ink); color: #fff; border-radius: var(--radius); }
    .skip:focus { top: 8px; }
    .copied {
      position: fixed; inset: auto auto 24px 50%; margin: 0; transform: translateX(-50%);
      align-items: center; gap: 10px; max-width: calc(100vw - 32px);
      padding: 12px 18px; border: 0; border-radius: var(--radius); background: var(--ink); color: #fff;
      box-shadow: var(--shadow-lg); font: inherit; font-size: 0.95rem;
    }
    .copied:popover-open { display: flex; animation: fade-up 0.3s var(--ease); }
    .copied app-icon { color: #7ee2a8; }
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
  protected readonly copied = signal<string | null>(null);
  protected readonly copyOk = signal(false);
  protected readonly copiedKind = signal<'tel' | 'mail'>('tel');
  private hideTimer?: ReturnType<typeof setTimeout>;
  private readonly copiedEl = viewChild.required<ElementRef<HTMLElement>>('copiedEl');

  /**
   * On computers tel: and mailto: links often open an empty tab or an app nobody has set up,
   * so there a click copies the number or address instead. Phones keep the normal behaviour.
   */
  protected onDocumentClick(event: MouseEvent): void {
    const link = (event.target as Element | null)?.closest?.('a[href^="tel:"], a[href^="mailto:"]') as HTMLAnchorElement | null;
    if (!link || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    event.preventDefault();
    const href = link.getAttribute('href')!;
    const isMail = href.startsWith('mailto:');
    const value = isMail
      ? decodeURIComponent(href.slice('mailto:'.length).split('?')[0])
      : (SITE.phones.find((p) => p.href === href)?.display ?? href.replace('tel:', ''));
    this.copiedKind.set(isMail ? 'mail' : 'tel');
    this.copyOk.set(false);
    this.copied.set(value);
    navigator.clipboard?.writeText(value).then(
      () => this.copyOk.set(true),
      () => this.copyOk.set(false),
    );
    const pop = this.copiedEl().nativeElement;
    // Re-open so it stacks above a dialog that was opened after it.
    if (pop.matches(':popover-open')) pop.hidePopover();
    pop.showPopover?.();
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => pop.hidePopover?.(), 4500);
  }
}
