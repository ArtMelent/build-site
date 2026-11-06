/** Company details shown across the site. Edit here to change them everywhere. */
export const SITE = {
  name: 'GeniusDev',
  legalName: 'Бурильна компанія GeniusDev',
  tagline: 'Горизонтальне направлене буріння',
  phones: [
    { display: '+38 (067) 807 77 99', href: 'tel:+380678077799' },
    { display: '+38 (066) 837 84 30', href: 'tel:+380668378430' },
  ],
  email: 'geniusdevgnb@gmail.com',
  foundedYear: 2020,
  /** Shown in the hero facts row. */
  experience: 'понад 7 років',
  defaultDescription:
    'Горизонтальне направлене буріння (ГНБ): прокол під дорогою та залізницею, безтраншейне прокладання водопроводу й каналізації, спайка труб. Безкоштовний виїзд спеціаліста й кошторис.',
} as const;
