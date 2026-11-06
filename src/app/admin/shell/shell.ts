import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ADMIN_API } from '../admin-api';
import { ToastService } from '../toast.service';
import { IconComponent } from '../../core/icon';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './shell.html',
  styleUrl: './admin.scss',
})
export class AdminShell {
  protected readonly api = inject(ADMIN_API);
  protected readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly email = signal<string | null>(null);

  constructor() {
    void this.api.currentEmail().then((e) => this.email.set(e));
  }

  protected async logout(): Promise<void> {
    await this.api.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
