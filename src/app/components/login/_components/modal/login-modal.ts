import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Checkbox } from '../../../../templates/checkbox/checkbox';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { TextField } from '../../../../templates/text-field/text-field';
import { HttpService } from '../../../../services/http-service/http-service';
import { AuthenticationService } from '../../../../services/authentication/authentication.service';
import { catchError, EMPTY } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [FormsModule, Checkbox, TextField],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.scss',
})
export class LoginModal {
  protected readonly email: WritableSignal<string> = signal<string>('');
  protected readonly password: WritableSignal<string> = signal<string>('');
  protected readonly isLoginDisabled: Signal<boolean> = computed(() =>
    !!(this.email() ||
      this.password() ||
      this.validateEmail(this.email()) ||
      this.validatePassword(this.password()))
  );
  rememberMe = false;
  rememberMeConfig = { title: 'Remember me' };

  private readonly router = inject(Router);
  private readonly overlayService = inject(OverlayService);
  private readonly httpService = inject(HttpService);
  private readonly authService = inject(AuthenticationService);

  protected onClick(): void {
    this.login();
  }

  protected validateEmail = (value: string): ValidationErrors | null => {
    if (!value) return null;

    if (!value.includes('@')) {
      return { invalidEmail: true, feedback: 'Email must contain an "@" symbol', icon: 'warningRed' };
    }

    const atIndex = value.indexOf('@');
    const localPart = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1);

    if (!localPart) {
      return { invalidEmail: true, feedback: 'Enter your username before the "@" symbol', icon: 'warningRed' };
    }

    if (!domain) {
      return { invalidEmail: true, feedback: 'Enter a domain after the "@" symbol', icon: 'warningRed' };
    }

    if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
      return { invalidEmail: true, feedback: 'Domain must include a valid extension (e.g. ".com")', icon: 'warningRed' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return { invalidEmail: true, feedback: 'Enter a valid email address (e.g. name@example.com)', icon: 'warningRed' };
    }

    return null;
  };

  protected validatePassword = (value: string): ValidationErrors | null => {
    if (!value) return null;

    if (value.length < 8) {
      return { invalidPassword: true, feedback: 'Password must be at least 8 characters', icon: 'warningRed' };
    }

    if (!/[A-Z]/.test(value)) {
      return { invalidPassword: true, feedback: 'Password must contain at least one uppercase letter', icon: 'warningRed' };
    }

    if (!/[a-z]/.test(value)) {
      return { invalidPassword: true, feedback: 'Password must contain at least one lowercase letter', icon: 'warningRed' };
    }

    if (!/[^a-zA-Z0-9]/.test(value)) {
      return { invalidPassword: true, feedback: 'Password must contain at least one special character', icon: 'warningRed' };
    }

    return null;
  };

  protected onSignupClick(): void {
    this.overlayService.close();
    this.router.navigate(['login']);
  }

  private login(): void {
    this.httpService.login(this.email(), this.password())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.warn(error);
          return EMPTY;
        })
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
}
