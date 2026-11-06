import type { Service } from '../models';
import data from './services.json';

/**
 * Service catalogue. To add, edit or hide a service, edit services.json
 * (set "is_published": false to hide). Lower "sort_order" comes first.
 */
export const SERVICES: Service[] = (data as Service[])
  .filter((s) => s.is_published)
  .sort((a, b) => a.sort_order - b.sort_order);
