import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TextField } from '../../../../templates/text-field/text-field';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { HttpService } from '../../../../services/http-service/http-service';
import { AuthenticationService } from '../../../../services/authentication/authentication.service';
import { catchError, EMPTY } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  triggerGithubSignIn,
  triggerGoogleSignIn,
  triggerMicrosoftSignIn,
  validateEmail,
  validatePassword,
} from '../../login.utils';

type Step = 'email' | 'otp';

@Component({
  selector: 'app-signup-modal',
  standalone: true,
  imports: [FormsModule, TextField],
  templateUrl: './signup-modal.component.html',
  styleUrl: './signup-modal.component.scss',
})
export class SignupModal {
  protected readonly step = signal<Step>('email');
  protected readonly email = signal('');
  protected readonly otpDigits = signal<string[]>(['', '', '', '', '', '']);
  protected readonly displayName = signal('');
  protected readonly password = signal('');
  protected readonly serverError = signal('');
  protected readonly isSending = signal(false);

  protected readonly isSignupDisabled = computed(
    () => !this.email() || !!this.validateEmail(this.email()),
  );

  protected readonly isVerifyDisabled = computed(
    () =>
      this.otpDigits().some((d) => !d) ||
      !this.displayName() ||
      !this.password() ||
      !!this.validatePassword(this.password()),
  );

  private readonly router = inject(Router);
  private readonly overlayService = inject(OverlayService);
  private readonly httpService = inject(HttpService);
  private readonly authService = inject(AuthenticationService);

  protected readonly validateEmail = validateEmail;
  protected readonly validatePassword = validatePassword;

  protected onSignup(): void {
    if (this.isSignupDisabled()) return;
    this.isSending.set(true);
    this.serverError.set('');

    this.httpService
      .sendOtp(this.email())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.serverError.set(error.error?.error || 'Failed to send OTP');
          this.isSending.set(false);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.isSending.set(false);
        this.step.set('otp');
      });
  }

  protected onVerify(): void {
    if (this.isVerifyDisabled()) return;
    this.serverError.set('');
    const code = this.otpDigits().join('');

    this.httpService
      .verifyOtp(this.email(), code, this.displayName(), this.password())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.serverError.set(error.error?.error || 'Verification failed');
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.authService.authToken = res.token;
        sessionStorage.setItem('example_token', res.token);
        this.authService.currentUser = res.user;
        this.router.navigate(['app/home']);
        this.overlayService.close();
      });
  }

  protected onResendOtp(): void {
    this.isSending.set(true);
    this.serverError.set('');
    this.httpService
      .sendOtp(this.email())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.serverError.set(error.error?.error || 'Failed to resend OTP');
          this.isSending.set(false);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.isSending.set(false);
      });
  }

  protected onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 1);
    input.value = value;

    const digits = [...this.otpDigits()];
    digits[index] = value;
    this.otpDigits.set(digits);

    if (value && index < 5) {
      const next = input.parentElement?.querySelectorAll('input')[index + 1];
      next?.focus();
    }
  }

  protected onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const prev = (
        event.target as HTMLElement
      ).parentElement?.querySelectorAll('input')[index - 1];
      prev?.focus();
    }
  }

  protected onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    const digits = [...this.otpDigits()];
    for (let i = 0; i < 6; i++) {
      digits[i] = pasted[i] || '';
    }
    this.otpDigits.set(digits);
    const inputs = (event.target as HTMLElement)
      .closest('.otp-inputs')
      ?.querySelectorAll('input');
    const focusIdx = Math.min(pasted.length, 5);
    (inputs?.[focusIdx] as HTMLInputElement)?.focus();
  }

  protected async onGoogleClick(): Promise<void> {
    const idToken = await triggerGoogleSignIn();
    this.httpService
      .googleLogin(idToken)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        /* store token, navigate */
      });
  }

  protected async onMicrosoftClick(): Promise<void> {
    const idToken = await triggerMicrosoftSignIn();
    this.httpService
      .microsoftLogin(idToken)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.authService.authToken = res.token;
        sessionStorage.setItem('example_token', res.token);
        this.authService.currentUser = res.user;
        this.router.navigate(['app/home']);
        this.overlayService.close();
      });
  }

  protected async onLinkedInClick(): Promise<void> {
    triggerGithubSignIn();
  }

  protected async onGithubClick(): Promise<void> {
    triggerGithubSignIn();
  }
}
