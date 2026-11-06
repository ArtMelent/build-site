import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SiteDataService } from '../../core/data/site-data.service';
import { LeadService } from '../../core/lead.service';
import { IconComponent } from '../../core/icon';
import { SITE } from '../../core/site';

let uid = 0;

@Component({
  selector: 'app-lead-form',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lead-form.html',
  styleUrl: './lead-form.scss',
})
export class LeadFormComponent {
  /** Preselects a service in the dropdown. */
  readonly serviceSlug = input<string | null>(null);
  /** Hide the service dropdown (e.g. on a service page where it is implied). */
  readonly hideService = input(false);
  readonly submitLabel = input('Отримати консультацію');
  readonly sent = output<void>();

  protected readonly site = SITE;
  protected readonly data = inject(SiteDataService);
  private readonly leads = inject(LeadService);
  private readonly router = inject(Router);
  protected readonly id = `lf${++uid}`;

  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly service = signal('');
  protected readonly message = signal('');
  protected readonly website = signal('');
  private startedAt = Date.now();

  protected readonly status = signal<'idle' | 'sending' | 'done' | 'error'>('idle');
  protected readonly demo = signal(false);
  protected readonly formError = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly touched = signal(false);

  protected readonly selectedTitle = computed(() => this.data.bySlug().get(this.service())?.title ?? null);

  constructor() {
    effect(() => this.service.set(this.serviceSlug() ?? ''));
  }

  private validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.name().trim()) e['name'] = "Вкажіть, як до вас звертатися";
    const digits = this.phone().replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) e['phone'] = 'Вкажіть номер телефону, наприклад 067 123 45 67';
    return e;
  }

  protected onBlur(): void {
    if (this.touched()) this.errors.set(this.validate());
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.touched.set(true);
    const errors = this.validate();
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      document.getElementById(`${this.id}-${Object.keys(errors)[0]}`)?.focus();
      return;
    }

    this.status.set('sending');
    this.formError.set('');
    const result = await this.leads.submit({
      name: this.name().trim(),
      phone: this.phone().trim(),
      message: this.message().trim(),
      serviceSlug: this.service() || null,
      sourcePage: this.router.url,
      website: this.website(),
      startedAt: this.startedAt,
    });

    if (result.ok) {
      this.demo.set(!!result.demo);
      this.status.set('done');
      this.sent.emit();
    } else {
      this.errors.set(result.fieldErrors ?? {});
      this.formError.set(result.message);
      this.status.set('error');
    }
  }

  protected reset(): void {
    this.name.set('');
    this.phone.set('');
    this.message.set('');
    this.service.set(this.serviceSlug() ?? '');
    this.errors.set({});
    this.touched.set(false);
    this.startedAt = Date.now();
    this.status.set('idle');
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
