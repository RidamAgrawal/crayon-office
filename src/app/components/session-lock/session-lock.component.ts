import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { OverlayService } from '../../services/overlay-service/overlay-service';
import { IdleService } from '../../services/idle-service/idle.service';

@Component({
  selector: 'app-session-lock',
  standalone: true,
  templateUrl: './session-lock.component.html',
  styleUrl: './session-lock.component.scss',
})
export class SessionLockComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);
  private readonly overlayService = inject(OverlayService);
  private readonly idleService = inject(IdleService);

  protected get user() {
    return this.authService.currentUser;
  }

  protected get initials(): string {
    const name = this.user?.displayName ?? '';
    return name
      .split(' ')
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  protected onContinue(): void {
    this.idleService.reset();
    this.overlayService.close();
  }

  protected onUseAnotherAccount(): void {
    this.overlayService.close();
    this.authService.authToken = null;
    this.authService.currentUser = null;
    sessionStorage.removeItem('example_token');
    this.idleService.stop();
    this.router.navigate(['/login']);
  }

  protected onRemoveAccount(): void {
    this.onUseAnotherAccount();
  }
}
