import { Injectable, signal } from '@angular/core';

/** Opens the site-wide "request a call" dialog, optionally with a service preselected. */
@Injectable({ providedIn: 'root' })
export class LeadDialogService {
  readonly open = signal(false);
  readonly serviceSlug = signal<string | null>(null);

  show(serviceSlug: string | null = null): void {
    this.serviceSlug.set(serviceSlug);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }
}
