import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ADMIN_API, friendlyError } from '../admin-api';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="login">
      <form class="login__card" (submit)="submit($event)" novalidate>
        <img src="assets/logo.svg" alt="GeniusDev" width="150" height="48" />
        <h1>{{ mode() === 'newPassword' ? 'Новий пароль' : 'Вхід в адмінку' }}</h1>
        @if (api.demo) {
          <p class="login__demo">Демо-режим: база даних ще не підключена. Введіть будь-яку пошту й пароль, щоб подивитися панель.</p>
        }
        @if (denied()) {
          <p class="login__error" role="alert">Цей акаунт не має доступу до адмінки. Увійдіть під акаунтом адміністратора.</p>
        }
        @if (mode() !== 'newPassword') {
        <div class="field">
          <label for="email">Пошта</label>
          <input class="input" id="email" type="email" autocomplete="username" required [value]="email()" (input)="email.set(val($event))" />
        </div>
        }
        @if (mode() !== 'reset') {
          <div class="field">
            <label for="password">{{ mode() === 'newPassword' ? 'Новий пароль (мінімум 8 символів)' : 'Пароль' }}</label>
            <input class="input" id="password" type="password" [attr.autocomplete]="mode() === 'newPassword' ? 'new-password' : 'current-password'" required [value]="password()" (input)="password.set(val($event))" />
          </div>
        }
        @if (error()) { <p class="login__error" role="alert">{{ error() }}</p> }
        @if (info()) { <p class="login__info" role="status">{{ info() }}</p> }
        <button class="btn btn--block" type="submit" [disabled]="busy()">
          {{ busy() ? 'Зачекайте…' : mode() === 'login' ? 'Увійти' : mode() === 'reset' ? 'Надіслати посилання' : 'Зберегти пароль' }}
        </button>
        @if (mode() !== 'newPassword') {
        <button type="button" class="login__switch" (click)="toggleMode()">
          {{ mode() === 'login' ? 'Забули пароль?' : 'Повернутися до входу' }}
        </button>
        }
      </form>
    </div>
  `,
  styles: `
    .login { min-height: 100vh; display: grid; place-items: center; padding: 20px; background: var(--bg-soft); }
    .login__card { width: min(400px, 100%); display: grid; gap: 16px; padding: 32px; background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); border-top: 4px solid var(--red); }
    .login__card img { width: 140px; }
    .login__card h1 { font-size: 1.7rem; }
    .login__demo { font-size: 0.9rem; padding: 10px 12px; background: var(--amber-tint); border-radius: var(--radius); }
    .login__error { padding: 10px 12px; background: var(--red-tint); color: var(--red-dark); border-radius: var(--radius); font-size: 0.92rem; }
    .login__info { padding: 10px 12px; background: var(--ok-tint); color: var(--ok); border-radius: var(--radius); font-size: 0.92rem; }
    .login__switch { border: 0; background: none; color: var(--muted); cursor: pointer; text-decoration: underline; font-size: 0.9rem; }
  `,
})
export class LoginPage {
  readonly next = input<string>('');
  readonly deniedParam = input<string>('', { alias: 'denied' });
  readonly resetParam = input<string>('', { alias: 'reset' });

  protected readonly api = inject(ADMIN_API);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly info = signal('');
  protected readonly mode = signal<'login' | 'reset' | 'newPassword'>('login');
  protected readonly denied = signal(false);

  constructor() {
    queueMicrotask(() => {
      this.denied.set(!!this.deniedParam());
      if (this.resetParam()) this.mode.set('newPassword');
    });
  }

  protected val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected toggleMode(): void {
    this.mode.update((m) => (m === 'login' ? 'reset' : 'login'));
    this.error.set('');
    this.info.set('');
  }

  protected async submit(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    this.info.set('');
    if (this.mode() === 'newPassword') {
      if (this.password().length < 8) return this.error.set('Пароль має містити щонайменше 8 символів.');
      this.busy.set(true);
      try {
        await this.api.updatePassword(this.password());
        await this.router.navigateByUrl('/admin');
      } catch (err) {
        this.error.set(friendlyError(err));
      } finally {
        this.busy.set(false);
      }
      return;
    }
    if (!this.email().includes('@')) return this.error.set('Вкажіть пошту.');
    this.busy.set(true);
    try {
      if (this.mode() === 'reset') {
        await this.api.sendPasswordReset(this.email());
        this.info.set('Якщо такий акаунт існує, ми надіслали лист із посиланням для зміни пароля.');
        return;
      }
      if (!this.password()) return this.error.set('Вкажіть пароль.');
      await this.api.signIn(this.email(), this.password());
      if (!(await this.api.isAdmin())) {
        await this.api.signOut();
        this.denied.set(true);
        return;
      }
      const next = this.next();
      await this.router.navigateByUrl(next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin');
    } catch (err) {
      this.error.set(friendlyError(err));
    } finally {
      this.busy.set(false);
    }
  }
}
