import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ADMIN_API, friendlyError } from '../admin-api';
import { ToastService } from '../toast.service';
import { formatPrice, type Service } from '../../core/models';
import { IconComponent } from '../../core/icon';

@Component({
  selector: 'app-admin-services',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesPage {
  private readonly api = inject(ADMIN_API);
  private readonly toast = inject(ToastService);

  protected readonly services = signal<Service[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly confirmDelete = signal<string | null>(null);
  protected readonly price = formatPrice;

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.services.set(await this.api.listServices());
    } catch (e) {
      this.toast.error(friendlyError(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected async togglePublished(s: Service): Promise<void> {
    const is_published = !s.is_published;
    this.patchLocal(s.id, { is_published });
    try {
      await this.api.updateService(s.id, { is_published });
      this.toast.ok(is_published ? `«${s.title}» показано на сайті` : `«${s.title}» приховано з сайту`);
    } catch (e) {
      this.patchLocal(s.id, { is_published: !is_published });
      this.toast.error(friendlyError(e));
    }
  }

  /** Moves a service up or down; renumbers the whole list in steps of 10. */
  protected async move(index: number, dir: -1 | 1): Promise<void> {
    const list = [...this.services()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const renumbered = list.map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
    const before = this.services();
    const prevOrder = new Map(before.map((s) => [s.id, s.sort_order]));
    const changed = renumbered.filter((s) => prevOrder.get(s.id) !== s.sort_order);
    this.services.set(renumbered);
    this.busy.set(true);
    try {
      await Promise.all(changed.map((s) => this.api.updateService(s.id, { sort_order: s.sort_order })));
    } catch (e) {
      this.services.set(before);
      this.toast.error(friendlyError(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(s: Service): Promise<void> {
    try {
      await this.api.deleteService(s.id);
      this.services.update((list) => list.filter((x) => x.id !== s.id));
      this.toast.ok(`«${s.title}» видалено`);
    } catch (e) {
      this.toast.error(friendlyError(e));
    } finally {
      this.confirmDelete.set(null);
    }
  }

  private patchLocal(id: string, patch: Partial<Service>): void {
    this.services.update((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
}
