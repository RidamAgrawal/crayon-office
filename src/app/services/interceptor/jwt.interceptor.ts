import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, EMPTY, Observable } from "rxjs";
import { AuthenticationService } from "../authentication/authentication.service";

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

    private authService = inject(AuthenticationService);

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authToken = this.authService.authToken;

        if (authToken) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                }
            });
        }
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === HttpStatusCode.Unauthorized) {
                    console.warn('user is unauthorized');
                } else if (error.status === HttpStatusCode.Forbidden) {
                    console.warn('forbidden');
                }
                return EMPTY;
            })
        );
    }

}