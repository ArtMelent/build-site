import { Directive, ElementRef, OnDestroy, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Fades an element in when it scrolls into view.
 * Content is fully visible without JavaScript and for people who prefer reduced motion:
 * the hidden starting state only applies once this directive has armed the element in the browser.
 */
@Directive({ selector: '[reveal]', host: { class: 'reveal' } })
export class RevealDirective implements OnDestroy {
  /** Delay in ms, for staggering siblings. */
  readonly reveal = input<number | string>('');

  private observer?: IntersectionObserver;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
      const rect = this.el.getBoundingClientRect();
      if (rect.top < innerHeight * 0.9) return; // already on screen: don't hide it
      const delay = Number(this.reveal()) || 0;
      if (delay) this.el.style.setProperty('--reveal-delay', `${delay}ms`);
      this.el.classList.add('reveal--armed');
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.el.classList.add('reveal--in');
            this.observer?.disconnect();
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      this.observer.observe(this.el);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
