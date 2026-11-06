import { Component, Renderer2, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  constructor(private renderer: Renderer2) {}

  scrollToTop() {
    this.renderer.setProperty(window, 'scrollBehavior', 'smooth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
