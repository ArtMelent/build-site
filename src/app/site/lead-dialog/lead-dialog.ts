import { ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID, effect, inject, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LeadDialogService } from '../../core/lead-dialog.service';
import { LeadFormComponent } from '../lead-form/lead-form';
import { IconComponent } from '../../core/icon';
import { SITE } from '../../core/site';

@Component({
  selector: 'app-lead-dialog',
  imports: [LeadFormComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dlg aria-labelledby="lead-dialog-title" (close)="dialog.close()" (click)="backdrop($event)">
      <div class="panel">
        <button type="button" class="close" (click)="dialog.close()" aria-label="Закрити"><app-icon name="close" /></button>
        <p class="eyebrow">Безкоштовна консультація</p>
        <h2 id="lead-dialog-title">Залишіть заявку</h2>
        <p class="sub">Передзвонимо, уточнимо задачу й домовимося про безкоштовний виїзд спеціаліста.</p>
        @if (dialog.open()) {
          <app-lead-form [serviceSlug]="dialog.serviceSlug()" submitLabel="Надіслати заявку" />
        }
        <p class="or">або телефонуйте: <a [href]="site.phones[0].href">{{ site.phones[0].display }}</a></p>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(560px, calc(100vw - 24px)); max-height: calc(100dvh - 24px);
      padding: 0; border: 0; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
      color: var(--text); overflow: auto;
    }
    dialog[open] { animation: pop 0.35s var(--ease); }
    dialog::backdrop { background: rgba(26, 24, 24, 0.55); backdrop-filter: blur(3px); }
    @keyframes pop { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
    .panel { position: relative; padding: clamp(24px, 5vw, 36px); display: grid; gap: 4px; }
    h2 { font-size: clamp(1.7rem, 4vw, 2.2rem); margin-bottom: 4px; }
    .sub { color: var(--muted); margin-bottom: 18px; }
    .close { position: absolute; top: 12px; right: 12px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: none; color: var(--muted); cursor: pointer; border-radius: var(--radius); }
    .close:hover { background: var(--bg-soft); color: var(--ink); }
    .or { margin-top: 14px; text-align: center; font-size: 0.95rem; color: var(--muted); }
    .or a { font-weight: 500; }
  `,
})
export class LeadDialogComponent {
  protected readonly dialog = inject(LeadDialogService);
  protected readonly site = SITE;
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    effect(() => {
      if (!isBrowser) return;
      const el = this.dlg().nativeElement;
      if (this.dialog.open() && !el.open) el.showModal();
      if (!this.dialog.open() && el.open) el.close();
    });
  }

  protected backdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dialog.close();
  }
}
