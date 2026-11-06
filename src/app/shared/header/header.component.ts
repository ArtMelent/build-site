import { Component, ElementRef, HostListener, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  isNavbarVisible = true;
  isOpened = false;
  headerHeight = 0;
  private lastScrollPosition = 0;

  /** Scrolls to a section on the landing page, navigating there first if needed. */
  scrollToSection(sectionId: string): void {
    const scroll = () => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });

    if (this.router.url === '/') {
      scroll();
    } else {
      // Small delay so the landing page has rendered before scrolling.
      this.router.navigate(['']).then(() => setTimeout(scroll, 10));
    }
  }

  /** Hide the navbar while scrolling down, show it again on scroll up. */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollPosition = window.scrollY;

    if (currentScrollPosition > this.lastScrollPosition && this.isNavbarVisible) {
      this.isNavbarVisible = false;
    } else if (currentScrollPosition < this.lastScrollPosition && !this.isNavbarVisible) {
      this.isNavbarVisible = true;
    }

    this.lastScrollPosition = currentScrollPosition;
  }

  toggleBurgerMenu(): void {
    this.setMenuOpen(!this.isOpened);
  }

  /** Close the mobile menu on any click outside the burger icon. */
  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    const burgerIcon = this.elementRef.nativeElement.querySelector('.burger-menu');
    if (this.isOpened && !burgerIcon?.contains(target as Node)) {
      this.setMenuOpen(false);
    }
  }

  private setMenuOpen(open: boolean): void {
    this.isOpened = open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
}
