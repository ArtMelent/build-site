import { Routes } from '@angular/router';
import { SiteLayout } from './site/layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: SiteLayout,
    children: [
      { path: '', loadComponent: () => import('./site/home/home').then((m) => m.HomePage) },
      { path: 'services/:slug', loadComponent: () => import('./site/service-page/service-page').then((m) => m.ServicePage) },
      { path: 'contacts', loadComponent: () => import('./site/contacts/contacts').then((m) => m.ContactsPage) },
      { path: '**', loadComponent: () => import('./site/not-found/not-found').then((m) => m.NotFoundPage) },
    ],
  },
];
