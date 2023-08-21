import { Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isNavbarVisible: boolean = true;
  lastScrollPosition: number = 0;
  isScrollingStarted: boolean = false;
  isOpened: boolean = false;
  headerHeight: number = 0;

  constructor(private router: Router, private renderer: Renderer2, private elementRef: ElementRef) {
    this.setActiveRoute(router.url);

    // Subscribe to route changes to update the active class
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setActiveRoute(event.url);
      }
    });

    
  }
  ngOnInit(): void {

  }

  scrollToSection(sectionId: string) {
    const onLandingPage = this.router.url === '/';
  
    // If already on LandingPageComponent and the section is available on the page
    if (onLandingPage) {
      const element = document.getElementById(sectionId);
      if (element) {
        this.renderer.setProperty(window, 'scrollBehavior', 'smooth');
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to the LandingPageComponent and scroll to the section after navigation
      this.router.navigate(['']).then(() => {
        setTimeout(() => { // Add a small delay to ensure the view has updated after navigation
          const element = document.getElementById(sectionId);
          if (element) {
            this.renderer.setProperty(window, 'scrollBehavior', 'smooth');
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 10);
      });
    }
  }
  

  setActiveRoute(url: string): void {
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach((button) => {
      if (button.getAttribute('routerLink') === url) {
        this.renderer.addClass(button, 'active');
      } else {
        this.renderer.removeClass(button, 'active');
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any): void {
    const currentScrollPosition = window.pageYOffset;

    // Check if scrolling has started
    if (!this.isScrollingStarted) {
      this.isScrollingStarted = true;
    }

    if (currentScrollPosition > this.lastScrollPosition && this.isNavbarVisible) {
      // Hide the navbar on scroll down
      this.isNavbarVisible = false;
      this.renderer.addClass(document.querySelector('.header'), 'sticky');
    }

    if (currentScrollPosition < this.lastScrollPosition && !this.isNavbarVisible) {
      // Show the navbar on scroll up
      this.isNavbarVisible = true;
      this.renderer.removeClass(document.querySelector('.header'), 'sticky');
    }

    this.lastScrollPosition = currentScrollPosition;
  }

  toggleBurgerMenu() {
    this.isOpened = !this.isOpened;
    document.body.style.overflow = this.isOpened ? 'hidden' : '';
  }
  
  @HostListener('document:click', ['$event.target'])
  onClick(target: any) {
    const burgerMenu = document.querySelector('.material-icons');
    if (this.isOpened && !burgerMenu?.contains(target)) {
      this.isOpened = false;
      document.body.style.overflow = '';
    }
  }
}