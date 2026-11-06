import { RenderMode, ServerRoute } from '@angular/ssr';
import { SERVICES } from './core/data/services';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'contacts', renderMode: RenderMode.Prerender },
  {
    path: 'services/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => SERVICES.map((s) => ({ slug: s.slug })),
  },
  // Unknown URLs render the 404 page in the browser.
  { path: '**', renderMode: RenderMode.Client },
];
