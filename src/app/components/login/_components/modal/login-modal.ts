import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  Signal,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Checkbox } from '../../../../templates/checkbox/checkbox';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { TextField } from '../../../../templates/text-field/text-field';
import { HttpService } from '../../../../services/http-service/http-service';
import { AuthenticationService } from '../../../../services/authentication/authentication.service';
import { catchError, EMPTY, map, switchMap } from 'rxjs';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
  initGoogleButton,
  triggerGithubSignIn,
  triggerLinkedinSignIn,
  triggerMicrosoftSignIn,
  validateEmail,
  validatePassword,
} from '../../login.utils';
import { environment } from '../../../../../environments/environment';
import { UserLoginSuccessResponse } from '../../../../models';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [FormsModule, Checkbox, TextField],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.scss',
})
export class LoginModalComponent implements AfterViewInit {
  @ViewChild('googleBtnContainer')
  private googleBtnContainer!: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly overlayService = inject(OverlayService);
  private readonly httpService = inject(HttpService);
  private readonly authService = inject(AuthenticationService);

  protected readonly email: WritableSignal<string> = signal<string>('');
  protected readonly password: WritableSignal<string> = signal<string>('');
  protected readonly recoveryEmail: WritableSignal<string> = signal<string>('asa');
  protected readonly isLoginDisabled: Signal<boolean> = computed(
    () =>
      !(
        this.email() &&
        this.password() &&
        !validateEmail(this.email()) &&
        !validatePassword(this.password())
      ),
  );

  protected readonly isSending = signal(false);
  protected readonly validateEmail = validateEmail;
  protected readonly validatePassword = validatePassword;

  protected readonly rememberMe = false;
  protected readonly rememberMeConfig = { title: 'Remember me' };
  protected resetPassword = true;

  protected readonly errorMessage: WritableSignal<string> = signal<string>('');
  protected readonly errorStatus: WritableSignal<number | null> = signal<number | null>(0);

  public ngOnInit(): void {
    this.activatedRoute.queryParams
      .pipe(
        switchMap((queryParams) => {
          const code = queryParams['code'];
          return code ? this.httpService.githubLogin(queryParams['code']) : EMPTY;
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.loginSuccessHandler(res);
      });

    const params = new URL(window.location.href).searchParams;
    const code = params.get('code');
    const state = params.get('state');

    if (code && state === sessionStorage.getItem('linkedin_oauth_state')) {
      sessionStorage.removeItem('linkedin_oauth_state');
      this.httpService.linkedinLogin(code).subscribe((res) => {
        this.loginSuccessHandler(res);
      });
    }
  }

  protected onClick(): void {
    this.login();
  }

  private login(): void {
    this.httpService
      .login(this.email(), this.password())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (
            [
              HttpStatusCode.Unauthorized,
              HttpStatusCode.InternalServerError,
              HttpStatusCode.BadRequest,
            ].includes(error.status)
          ) {
            this.errorMessage.set(error.error.error);
            this.errorStatus.set(error.status);
          }
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        sessionStorage.setItem('example_token', res.token);
        this.authService.currentUser = res.user;
        this.router.navigate(['app/home']);
        this.overlayService.close();
      });
  }

  public ngAfterViewInit(): void {
    initGoogleButton(this.googleBtnContainer.nativeElement, (idToken) => {
      this.httpService
        .googleLogin(idToken)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('[Google login]', error);
            return EMPTY;
          }),
        )
        .subscribe((res) => {
          if (!res) return;
          this.loginSuccessHandler(res);
        });
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
        this.loginSuccessHandler(res);
      });
  }

  protected async onLinkedInClick(): Promise<void> {
    triggerLinkedinSignIn();
  }

  protected async onGithubClick(): Promise<void> {
    triggerGithubSignIn();
  }

  private loginSuccessHandler(res: UserLoginSuccessResponse): void {
    sessionStorage.setItem('example_token', res.token);
    this.authService.currentUser = res.user;
    this.router.navigate(['app/home']);
    this.overlayService.close();
  }
}
