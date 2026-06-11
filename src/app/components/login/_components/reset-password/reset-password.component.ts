import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import { HttpService } from '../../../../services/http-service/http-service';
import { TextField } from '../../../../templates/text-field/text-field';
import { validateEmail, validatePassword } from '../../login.utils';
import { ActivatedRoute, Router } from '@angular/router';

export type RecoveryStep = 'email' | 'sent' | 'reset';

@Component({
  templateUrl: './reset-password.component.html',
  selector: 'reset-password',
  styleUrl: './reset-password.component.scss',
  imports: [TextField],
})
export class ResetPasswordComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly httpService = inject(HttpService);

  protected readonly token = signal<string>('');
  protected readonly recoveryStep = signal<RecoveryStep>('email');
  protected readonly recoveryEmail = signal<string>('');
  protected readonly newPassword = signal<string>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly serverError = signal('');
  protected readonly isSending = signal(false);
  protected readonly isDisabled = computed(
    () => !(this.recoveryEmail() && !this.validateEmail(this.recoveryEmail())),
  );
  protected readonly isResetDisabled = computed(
    () =>
      !(
        this.newPassword() &&
        this.confirmPassword() &&
        this.newPassword() === this.confirmPassword() &&
        !this.validatePassword(this.newPassword()) &&
        !this.validatePassword(this.confirmPassword())
      ),
  );
  protected readonly isNotMatch = computed(
    () =>
      !!(
        this.newPassword() &&
        this.confirmPassword() &&
        !this.validatePassword(this.newPassword()) &&
        !this.validatePassword(this.confirmPassword()) &&
        this.newPassword() !== this.confirmPassword()
      ),
  );
  protected readonly validateEmail = validateEmail;
  protected readonly validatePassword = validatePassword;

  public ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((queryParams) => {
      if ('token' in queryParams) {
        this.token.set(queryParams['token']);
        this.recoveryStep.set('reset');
      }
    });
  }

  protected onResendRecoveryLink(): void {
    if (this.isSending()) return;
    this.isSending.set(true);
    this.serverError.set('');
    this.httpService
      .sendRecoveryLink(this.recoveryEmail())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.serverError.set(error.error?.error || 'Failed to resend recovery link');
          this.isSending.set(false);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.isSending.set(false);
        this.recoveryStep.set('sent');
      });
  }

  protected onClick(): void {
    if (this.recoveryStep() === 'email') {
      this.onResendRecoveryLink();
    } else {
      this.onResetPassword();
    }
  }

  protected onResetPassword(): void {
    if (this.isSending()) return;
    this.isSending.set(true);
    this.serverError.set('');
    this.httpService
      .resetPassword(this.token(), this.newPassword())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.serverError.set(error.error?.error || 'Failed to reset password');
          this.isSending.set(false);
          return EMPTY;
        }),
      )
      .subscribe(() => this.router.navigate(['/login']));
  }
}
