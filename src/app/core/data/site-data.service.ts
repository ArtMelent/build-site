import { Injectable, computed, signal } from '@angular/core';
import type { Service } from '../models';
import { SERVICES } from './services';

/** Read access to the service catalogue for components. */
@Injectable({ providedIn: 'root' })
export class SiteDataService {
  readonly services = signal<Service[]>(SERVICES).asReadonly();
  readonly bySlug = computed(() => new Map(this.services().map((s) => [s.slug, s])));
}
