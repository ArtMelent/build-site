import type { Service } from '../models';
import seed from './seed-services.json';

/** Built-in content: used in demo mode and as a fallback if the database can't be reached at build time. */
export const SEED_SERVICES: Service[] = (seed as Omit<Service, 'id'>[]).map((s) => ({ ...s, id: `seed-${s.slug}` }));
