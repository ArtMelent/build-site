import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeUk from '@angular/common/locales/uk';
import { ADMIN_API, STATUS_LABEL, friendlyError } from '../admin-api';
import { ToastService } from '../toast.service';
import { LEAD_STATUSES, type Lead, type LeadStatus } from '../../core/models';
import { IconComponent } from '../../core/icon';

registerLocaleData(localeUk);

type Filter = LeadStatus | 'all' | 'open';

@Component({
  selector: 'app-admin-leads',
  imports: [DatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leads.html',
  styleUrl: './leads.scss',
})
export class LeadsPage {
  private readonly api = inject(ADMIN_API);
  private readonly toast = inject(ToastService);

  protected readonly statuses = LEAD_STATUSES;
  protected readonly label = STATUS_LABEL;
  protected readonly leads = signal<Lead[]>([]);
  protected readonly loading = signal(true);
  protected readonly filter = signal<Filter>('open');
  protected readonly confirmDelete = signal<string | null>(null);

  protected readonly counts = computed(() => {
    const c: Record<string, number> = { all: this.leads().length, open: 0 };
    for (const l of this.leads()) {
      c[l.status] = (c[l.status] ?? 0) + 1;
      if (l.status === 'new' || l.status === 'in_progress') c['open']++;
    }
    return c;
  });

  protected readonly visible = computed(() => {
    const f = this.filter();
    return this.leads().filter((l) =>
      f === 'all' ? true : f === 'open' ? l.status === 'new' || l.status === 'in_progress' : l.status === f,
    );
  });

  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Активні' },
    { value: 'new', label: 'Нові' },
    { value: 'in_progress', label: 'В роботі' },
    { value: 'done', label: 'Виконані' },
    { value: 'spam', label: 'Спам' },
    { value: 'all', label: 'Усі' },
  ];

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.leads.set(await this.api.listLeads());
    } catch (e) {
      this.toast.error(friendlyError(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected async setStatus(lead: Lead, status: LeadStatus): Promise<void> {
    const prev = lead.status;
    this.patchLocal(lead.id, { status });
    try {
      await this.api.updateLead(lead.id, { status });
      this.toast.ok(`Статус: ${STATUS_LABEL[status]}`);
    } catch (e) {
      this.patchLocal(lead.id, { status: prev });
      this.toast.error(friendlyError(e));
    }
  }

  protected async saveNote(lead: Lead, note: string): Promise<void> {
    if (note === lead.admin_note) return;
    this.patchLocal(lead.id, { admin_note: note });
    try {
      await this.api.updateLead(lead.id, { admin_note: note });
      this.toast.ok('Нотатку збережено');
    } catch (e) {
      this.toast.error(friendlyError(e));
    }
  }

  protected async remove(lead: Lead): Promise<void> {
    try {
      await this.api.deleteLead(lead.id);
      this.leads.update((list) => list.filter((l) => l.id !== lead.id));
      this.toast.ok('Заявку видалено');
    } catch (e) {
      this.toast.error(friendlyError(e));
    } finally {
      this.confirmDelete.set(null);
    }
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  private patchLocal(id: string, patch: Partial<Lead>): void {
    this.leads.update((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
}
