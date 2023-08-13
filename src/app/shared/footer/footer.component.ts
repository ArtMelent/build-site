import { Component, AfterViewInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  constructor(private renderer: Renderer2) {}

  scrollToTop() {
    this.renderer.setProperty(window, 'scrollBehavior', 'smooth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
