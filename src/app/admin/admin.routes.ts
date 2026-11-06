import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ADMIN_API } from './admin-api';
import { AdminShell } from './shell/shell';

const adminGuard: CanActivateFn = async (_route, state) => {
  const api = inject(ADMIN_API);
  const router = inject(Router);
  if (await api.isAdmin()) return true;
  const hasSession = !!(await api.currentEmail());
  return router.createUrlTree(['/admin/login'], {
    queryParams: { next: state.url, ...(hasSession ? { denied: 1 } : {}) },
  });
};

export const ADMIN_ROUTES: Routes = [
  { path: 'login', title: 'Вхід — адмінка GeniusDev', loadComponent: () => import('./login/login').then((m) => m.LoginPage) },
  {
    path: '',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'leads' },
      { path: 'leads', title: 'Заявки — адмінка GeniusDev', loadComponent: () => import('./leads/leads').then((m) => m.LeadsPage) },
      { path: 'services', title: 'Послуги — адмінка GeniusDev', loadComponent: () => import('./services/services').then((m) => m.ServicesPage) },
      {
        path: 'services/:id',
        title: 'Редагування послуги — адмінка GeniusDev',
        loadComponent: () => import('./service-edit/service-edit').then((m) => m.ServiceEditPage),
        canDeactivate: [(c: { canLeave(): boolean }) => c.canLeave()],
      },
    ],
  },
];
