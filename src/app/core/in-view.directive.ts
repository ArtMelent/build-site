import { Directive, ElementRef, OnDestroy, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Adds `is-armed` once in the browser (when motion is allowed), then `is-in-view`
 * the first time the element is sufficiently visible. CSS animates between the two.
 * Without JavaScript, or with reduced motion, neither class is set and the final state shows.
 */
@Directive({ selector: '[inView]' })
export class InViewDirective implements OnDestroy {
  /** Fraction of the element that must be visible (0–1). */
  readonly inView = input<number | string>(0.35);

  private observer?: IntersectionObserver;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
      this.el.classList.add('is-armed');
      const threshold = Math.min(1, Math.max(0, Number(this.inView()) || 0.35));
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            // Next frame, so the armed (start) state is painted before the transition begins.
            requestAnimationFrame(() => this.el.classList.add('is-in-view'));
            this.observer?.disconnect();
          }
        },
        { threshold },
      );
      this.observer.observe(this.el);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
