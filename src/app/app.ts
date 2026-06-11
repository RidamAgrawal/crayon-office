import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleService } from './services/idle-service/idle.service';
import { OverlayService } from './services/overlay-service/overlay-service';
import { AuthenticationService } from './services/authentication/authentication.service';
import { SessionLockComponent } from './components/session-lock';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly idleService = inject(IdleService);
  private readonly overlayService = inject(OverlayService);
  private readonly authService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);

  protected title = 'jira-clone';

  ngOnInit(): void {
    const sub = this.idleService.idle$.subscribe(() => {
      if (!this.authService.currentUser) return;

      this.overlayService.open({
        component: SessionLockComponent,
        hasBackdrop: true,
        backdropClass: 'session-lock-backdrop',
      });
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
    this.idleService.start();
  }
}
