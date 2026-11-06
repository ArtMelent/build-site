import { RenderMode, ServerRoute } from '@angular/ssr';
import { fetchPublishedServices } from './core/data/site-data.service';
import { SEED_SERVICES } from './core/data/seed';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'contacts', renderMode: RenderMode.Prerender },
  {
    path: 'services/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      let services = SEED_SERVICES;
      try {
        services = await fetchPublishedServices();
      } catch (e) {
        console.warn('Prerender: database unreachable, using built-in services', e);
      }
      return services.map((s) => ({ slug: s.slug }));
    },
  },
  // The admin panel, new services added after the last build, and unknown URLs render in the browser.
  { path: '**', renderMode: RenderMode.Client },
];
