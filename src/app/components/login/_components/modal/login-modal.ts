import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Checkbox } from '../../../../templates/checkbox/checkbox';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { TextField } from '../../../../templates/text-field/text-field';
import { HttpService } from '../../../../services/http-service/http-service';
import { AuthenticationService } from '../../../../services/authentication/authentication.service';
import { catchError, EMPTY } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { triggerGoogleSignIn, triggerMicrosoftSignIn, validateEmail, validatePassword } from '../../login.utils';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [FormsModule, Checkbox, TextField,],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.scss',
})
export class LoginModalComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute)
  private readonly overlayService = inject(OverlayService);
  private readonly httpService = inject(HttpService);
  private readonly authService = inject(AuthenticationService);

  protected readonly email: WritableSignal<string> = signal<string>('');
  protected readonly password: WritableSignal<string> = signal<string>('');
  protected readonly recoveryEmail: WritableSignal<string> = signal<string>('asa');
  protected readonly isLoginDisabled: Signal<boolean> = computed(() =>
    !(this.email() &&
      this.password() &&
      !validateEmail(this.email()) &&
      !validatePassword(this.password()))
  );

  protected readonly isSending = signal(false);
  protected readonly validateEmail = validateEmail;
  protected readonly validatePassword = validatePassword;


  protected readonly rememberMe = false;
  protected readonly rememberMeConfig = { title: 'Remember me' };
  protected resetPassword = true;

  protected onClick(): void {
    this.login();
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

  protected async onGoogleClick(): Promise<void> {
    const idToken = await triggerGoogleSignIn();
    this.httpService.googleLogin(idToken)
      .pipe(catchError((error: HttpErrorResponse) => {
        return EMPTY;
      }))
      .subscribe((res) => { /* store token, navigate */ });
  }

  protected async onMicrosoftClick(): Promise<void> {
    const idToken = await triggerMicrosoftSignIn();
    this.httpService.microsoftLogin(idToken)
      .pipe(catchError((error: HttpErrorResponse)=> {
        return EMPTY;
      }))
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
