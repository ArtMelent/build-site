import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { SiteDataService } from './core/data/site-data.service';
import { SiteLayout } from './site/layout/layout';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    component: SiteLayout,
    resolve: { services: () => inject(SiteDataService).ensureLoaded() },
    runGuardsAndResolvers: 'always',
    children: [
      { path: '', loadComponent: () => import('./site/home/home').then((m) => m.HomePage) },
      { path: 'services/:slug', loadComponent: () => import('./site/service-page/service-page').then((m) => m.ServicePage) },
      { path: 'contacts', loadComponent: () => import('./site/contacts/contacts').then((m) => m.ContactsPage) },
      { path: '**', loadComponent: () => import('./site/not-found/not-found').then((m) => m.NotFoundPage) },
    ],
  },
];
