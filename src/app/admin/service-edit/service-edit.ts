import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ADMIN_API, friendlyError } from '../admin-api';
import { ToastService } from '../toast.service';
import { toWebp } from '../image';
import { formatPrice, type Service, type ServiceDraft } from '../../core/models';
import { renderMarkdown } from '../../core/markdown';
import { slugify } from '../../core/translit';
import { IconComponent } from '../../core/icon';
import { ENV } from '../../core/env';

const EMPTY: ServiceDraft = {
  slug: '',
  title: '',
  short_description: '',
  intro: '',
  body: '',
  highlights: [],
  price_from: null,
  price_unit: 'грн',
  image_url: null,
  seo_title: null,
  seo_description: null,
  sort_order: 100,
  is_published: true,
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

@Component({
  selector: 'app-admin-service-edit',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-edit.html',
  styleUrl: './service-edit.scss',
})
export class ServiceEditPage {
  /** Route param: a service id, or "new". */
  readonly id = input.required<string>();

  private readonly api = inject(ADMIN_API);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly isNew = computed(() => this.id() === 'new');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly tab = signal<'write' | 'preview'>('write');
  protected readonly submitted = signal(false);

  protected readonly form = signal<ServiceDraft>({ ...EMPTY });
  private readonly savedSnapshot = signal(JSON.stringify(EMPTY));
  /** Slug follows the title until the user edits it by hand (only for new services). */
  private slugTouched = false;
  private otherSlugs = new Set<string>();

  protected readonly highlightsText = computed(() => this.form().highlights.join('\n'));
  protected readonly preview = computed(() => renderMarkdown(this.form().body));
  protected readonly price = computed(() => formatPrice(this.form()));
  protected readonly siteHost = ENV.siteUrl ? ENV.siteUrl.replace(/^https?:\/\//, '') : 'ваш-сайт.com.ua';
  protected readonly dirty = computed(() => JSON.stringify(this.form()) !== this.savedSnapshot());

  protected readonly errors = computed(() => {
    const f = this.form();
    const e: Record<string, string> = {};
    if (f.title.trim().length < 2) e['title'] = 'Вкажіть назву послуги.';
    if (!SLUG_RE.test(f.slug)) e['slug'] = 'Лише латинські малі літери, цифри й дефіси, напр. prokol-pid-dorohoiu.';
    else if (this.otherSlugs.has(f.slug)) e['slug'] = 'Така адреса вже є в іншої послуги.';
    if (f.price_from != null && (f.price_from < 0 || !Number.isInteger(f.price_from))) e['price_from'] = 'Ціле число, без пробілів.';
    if (f.short_description.length > 300) e['short_description'] = 'Не більше 300 символів.';
    if ((f.seo_title ?? '').length > 120) e['seo_title'] = 'Не більше 120 символів.';
    if ((f.seo_description ?? '').length > 300) e['seo_description'] = 'Не більше 300 символів.';
    return e;
  });

  constructor() {
    queueMicrotask(() => void this.load());
  }

  private async load(): Promise<void> {
    try {
      const all = await this.api.listServices();
      if (this.isNew()) {
        this.otherSlugs = new Set(all.map((s) => s.slug));
        const maxOrder = Math.max(0, ...all.map((s) => s.sort_order));
        this.setForm({ ...EMPTY, sort_order: maxOrder + 10 });
      } else {
        const s = all.find((x) => x.id === this.id()) ?? (await this.api.getService(this.id()));
        if (!s) {
          this.toast.error('Послугу не знайдено. Можливо, її вже видалили.');
          await this.router.navigateByUrl('/admin/services');
          return;
        }
        this.otherSlugs = new Set(all.filter((x) => x.id !== s.id).map((x) => x.slug));
        this.slugTouched = true;
        this.setForm(this.toDraft(s));
      }
    } catch (e) {
      this.toast.error(friendlyError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private toDraft(s: Service): ServiceDraft {
    const { id: _id, created_at: _c, updated_at: _u, ...draft } = s;
    return { ...EMPTY, ...draft, highlights: [...(draft.highlights ?? [])] };
  }

  private setForm(d: ServiceDraft): void {
    this.form.set(d);
    this.savedSnapshot.set(JSON.stringify(d));
  }

  protected set<K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]): void {
    this.form.update((f) => {
      const next = { ...f, [key]: value };
      if (key === 'title' && this.isNew() && !this.slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  protected text(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected onSlug(e: Event): void {
    this.slugTouched = true;
    this.set('slug', this.text(e).toLowerCase().trim());
  }

  protected onPrice(e: Event): void {
    const raw = this.text(e).replace(/\s/g, '');
    this.set('price_from', raw === '' ? null : Number(raw));
  }

  protected onHighlights(e: Event): void {
    this.set('highlights', this.text(e).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 8));
  }

  protected optional(e: Event): string | null {
    const v = this.text(e).trim();
    return v ? v : null;
  }

  protected async onFile(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    try {
      const webp = await toWebp(file);
      const url = await this.api.uploadImage(webp, this.form().slug || 'service');
      this.set('image_url', url);
      this.toast.ok(`Фото завантажено (${Math.round(webp.size / 1024)} КБ)`);
    } catch (err) {
      this.toast.error(friendlyError(err));
    } finally {
      this.uploading.set(false);
    }
  }

  protected async save(e?: Event): Promise<void> {
    e?.preventDefault();
    this.submitted.set(true);
    if (Object.keys(this.errors()).length) {
      this.toast.error('Перевірте поля, позначені червоним.');
      document.querySelector<HTMLElement>('.is-invalid')?.focus();
      return;
    }
    this.saving.set(true);
    const f = this.form();
    const draft: ServiceDraft = {
      ...f,
      title: f.title.trim(),
      short_description: f.short_description.trim(),
      intro: f.intro.trim(),
      body: f.body.trim(),
      price_unit: f.price_unit.trim() || 'грн',
    };
    try {
      if (this.isNew()) {
        const created = await this.api.createService(draft);
        this.setForm(this.toDraft(created));
        this.toast.ok('Послугу створено');
        await this.router.navigate(['/admin/services', created.id], { replaceUrl: true });
      } else {
        const updated = await this.api.updateService(this.id(), draft);
        this.setForm(this.toDraft(updated));
        this.toast.ok('Збережено. Зміни вже на сайті.');
      }
    } catch (err) {
      this.toast.error(friendlyError(err));
    } finally {
      this.saving.set(false);
    }
  }

  /** Used by the route's canDeactivate guard. */
  canLeave(): boolean {
    return !this.dirty() || confirm('Є незбережені зміни. Вийти без збереження?');
  }

  protected insert(before: string, after = '', placeholder = ''): void {
    const ta = document.getElementById('body') as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: en, value } = ta;
    const selected = value.slice(s, en) || placeholder;
    const next = value.slice(0, s) + before + selected + after + value.slice(en);
    this.set('body', next);
    queueMicrotask(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }
}
