import { ChangeDetectionStrategy, Component, DOCUMENT, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SiteDataService } from '../../core/data/site-data.service';
import { LeadDialogService } from '../../core/lead-dialog.service';
import { IconComponent } from '../../core/icon';
import { SITE } from '../../core/site';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '[class.is-scrolled]': 'scrolled()',
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'closeAll()',
  },
})
export class HeaderComponent {
  protected readonly site = SITE;
  protected readonly data = inject(SiteDataService);
  private readonly dialog = inject(LeadDialogService);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly servicesOpen = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.closeAll());

    effect(() => {
      if (this.isBrowser) this.doc.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    });
  }

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected toggleServices(): void {
    this.servicesOpen.update((v) => !v);
  }

  protected closeAll(): void {
    this.menuOpen.set(false);
    this.servicesOpen.set(false);
  }

  protected request(): void {
    this.closeAll();
    this.dialog.show();
  }
}
