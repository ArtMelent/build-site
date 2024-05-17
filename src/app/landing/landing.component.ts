import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  panelOpenState = false;


  cardCooperation = [
    { title: "Запит клієнта", description: "Запит клієнта повинен містити якомога більше інформації про проблему, яку вони хочуть вирішити. Це допоможе нам краще зрозуміти вашу потребу та надати вам найкраще можливе рішення." },
    { title: "Виїзд спеціаліста на об'єкт", description: "Наш спеціаліст приїжджає на ваш об'єкт, щоб провести огляд та оцінити обсяг роботи. Спеціаліст ознайомиться з вашими потребами та обговорить з вами деталі проекту. Він також проведе необхідні заміри та збере інформацію про об'єкт." },
    { title: "Узгодження об'єму роботи ", description: "На основі інформації, зібраної під час виїзду на об'єкт, наш спеціаліст складе план роботи та кошторис. План роботи буде включати опис всіх необхідних робіт, а також терміни їх виконання. Кошторис буде включати всі витрати, пов'язані з проектом, такі як вартість обладнання, матеріалів та послуг. Ми надамо вам план роботи та кошторис для вашого ознайомлення та затвердження." },
    { title: "Підпснання договору", description: "Після того, як ви погодитеся з планом роботи та кошторисом, ми підпишемо з вами договір. Договір буде включати всі умови нашого співробітництва, такі як терміни виконання робіт, вартість проекту та порядок оплати. Після підписання договору ми розпочнемо роботу над вашим проектом." },
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
    // {
    //   slug: 'posluhy-traysheynoho-kopacha',
    //   headline: 'Послуги трайшейного копача',
    //   imageSrc: 'assets/service-01.png',
    //   iconSrc: 'assets/service-icon.png',
    //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    //   price: '900'
    // },
    // {
    //   slug: 'znakhodzhennya-transheynykh-merezh',
    //   headline: 'Знаходження траншейних мереж',
    //   imageSrc: 'assets/trench-digger.jpg',
    //   iconSrc: 'assets/service-icon.png',
    //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    //   price: '900'
    // },

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
