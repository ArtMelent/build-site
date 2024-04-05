import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  panelOpenState = false;
  cardCooperation = [
    { title: 'Card 1', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { title: 'Card 2', description: 'Vestibulum dapibus aliquet libero, in malesuada felis tempus sed.' },
    { title: 'Card 3', description: 'Fusce interdum nunc id metus rhoncus, id aliquet tellus consectetur.' },
    { title: 'Card 4', description: 'Proin ac est lacinia, eleifend orci vitae, venenatis sapien.' },
     // Add more card objects as needed
  ];

  cardService = [
    {
      slug: 'prokol-pid-dorohoiu',
      headline: 'Прокол під дорогою',
      imageSrc: 'assets/service-under-road.png',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },
    {
      slug: 'prokol-pid-zaliznytseiu',
      headline: 'Прокол під залізницею',
      imageSrc: 'assets/under-railway.jpg',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },
    {
      slug: 'beztransheynoyu-rokladannya-vodoprovodu',
      headline: 'Безтраншейною прокладання водопроводу',
      imageSrc: 'assets/laying-water.jpg',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },
    {
      slug: 'beztransheyne-prokladannya-kanalizatsiyi',
      headline: 'Безтраншейне прокладання каналізації',
      imageSrc: 'assets/laying-sewerage.jpg',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },
    {
      slug: 'spayka-trub',
      headline: 'Спайка труб',
      imageSrc: 'assets/pipe-adhesion-2.jpg',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },
    {
      slug: 'posluhy-traysheynoho-kopacha',
      headline: 'Послуги трайшейного копача',
      imageSrc: 'assets/service-01.png',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },
    {
      slug: 'znakhodzhennya-transheynykh-merezh',
      headline: 'Знаходження траншейних мереж',
      imageSrc: 'assets/trench-digger.jpg',
      iconSrc: 'assets/service-icon.png',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      price: '900'
    },

    // Add more card objects as needed
  ];

  currentIndex = 0;

  @ViewChild('cooperationCards') cooperationCards!: ElementRef;

  setActiveCard(index: number): void {
    this.currentIndex = index;
  }
  formatCardNumber(cardIndex: number): string {
    return cardIndex < 10 ? `0${cardIndex}` : `${cardIndex}`;
  }
  // @HostListener('window:scroll', [])
  // onScroll() {
  //   const windowHeight = window.innerHeight;
  //   const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  //   const containerOffsetTop = this.cooperationCards.nativeElement.offsetTop;
  //   const cardHeight = this.cooperationCards.nativeElement.querySelector('.cooperation-card').offsetHeight;

  //   const newIndex = Math.floor((scrollY - containerOffsetTop) / cardHeight);

  //   if (newIndex !== this.currentIndex && newIndex >= 0 && newIndex < this.cards.length) {
  //     this.currentIndex = newIndex;
  //   }
  // }
}
