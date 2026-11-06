import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteDataService } from '../../core/data/site-data.service';
import { LeadDialogService } from '../../core/lead-dialog.service';
import { SeoService } from '../../core/seo.service';
import { IconComponent, type IconName } from '../../core/icon';
import { RevealDirective } from '../../core/reveal.directive';
import { InViewDirective } from '../../core/in-view.directive';
import { SITE } from '../../core/site';
import { ServiceCardComponent } from '../service-card/service-card';
import { LeadFormComponent } from '../lead-form/lead-form';

@Component({
  selector: 'app-home',
  imports: [IconComponent, RevealDirective, InViewDirective, ServiceCardComponent, LeadFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly site = SITE;
  protected readonly data = inject(SiteDataService);
  protected readonly dialog = inject(LeadDialogService);

  protected readonly facts = [
    { value: SITE.experience, label: 'досвіду в безтраншейних роботах' },
    { value: 'до 600 мм', label: 'діаметр каналу' },
    { value: 'понад 800 м', label: 'довжина одного проколу' },
    { value: '0 грн', label: 'виїзд спеціаліста й кошторис' },
  ];

  protected readonly benefits: { icon: IconName; title: string; text: string }[] = [
    { icon: 'road', title: 'Без траншей', text: 'Дорога, газон і мощення залишаються цілими. Не потрібно нічого розкопувати й потім відновлювати.' },
    { icon: 'clock', title: 'Швидше й дешевше', text: 'Без розкопування та ремонту покриття роботи займають менше часу й обходяться дешевше.' },
    { icon: 'shield', title: 'Точна траєкторія', text: 'Бур керується з поверхні, тому наявні кабелі й труби під землею залишаються неушкодженими.' },
    { icon: 'leaf', title: 'Бережемо довкілля', text: 'Ландшафт, дерева й будівлі на ділянці залишаються такими, як були до початку робіт.' },
  ];

  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    { icon: 'form', title: 'Заявка', text: 'Залиште заявку або зателефонуйте. Розкажіть, що й де потрібно прокласти: що більше деталей, то точніше ми підготуємося.' },
    { icon: 'visit', title: 'Виїзд спеціаліста', text: "Спеціаліст безкоштовно приїжджає на об'єкт, оглядає ділянку, робить заміри й обговорює з вами деталі." },
    { icon: 'calc', title: 'План і кошторис', text: 'Складаємо план робіт зі строками та кошторис з усіма витратами на обладнання, матеріали й роботу.' },
    { icon: 'doc', title: 'Договір і роботи', text: 'Підписуємо договір, де зафіксовані строки, вартість і порядок оплати, і виходимо на обʼєкт.' },
  ];

  protected readonly videos = [1, 2, 3].map((i) => ({
    src: `assets/video-portfolio-${i}.mp4`,
    poster: `assets/video-portfolio-${i}-poster.webp`,
  }));

  protected readonly faq = [
    {
      q: 'Скільки коштує прокол?',
      a: 'Ціни починаються від 900 грн. Точна вартість залежить від довжини траси, діаметра труби й ґрунту, тому її розраховує спеціаліст після безкоштовного виїзду на обʼєкт.',
    },
    {
      q: 'Чи потрібно щось розкопувати?',
      a: 'Лише два невеликі приямки на початку й у кінці траси. Дорога, газон чи будівлі між ними залишаються недоторканими.',
    },
    { q: 'Який максимальний діаметр і довжина?', a: 'Діаметр каналу до 600 мм, довжина однієї свердловини понад 800 м.' },
    {
      q: 'Які труби ви прокладаєте?',
      a: 'Найчастіше поліетиленові (ПНТ): вони служать до 80 років, витримують температуру від −60 до +120 °C і тиск до 20 бар. Підходять для водопроводу, каналізації та кабелю.',
    },
    {
      q: 'Чи не пошкодите ви наявні комунікації?',
      a: 'Бурова голівка керована, а її положення видно на локаторі. Траєкторію прокладаємо в обхід наявних труб і кабелів.',
    },
    { q: 'Як замовити виїзд спеціаліста?', a: 'Залиште заявку на сайті або зателефонуйте. Виїзд, огляд і кошторис безкоштовні.' },
  ];

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: 'Горизонтальне направлене буріння (ГНБ) — GeniusDev',
      description: SITE.defaultDescription,
      path: '/',
      jsonLd: [
        seo.organization(),
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: this.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        },
      ],
    });
  }
}
