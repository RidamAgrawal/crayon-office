import { HttpClient, HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, of, switchMap, tap } from "rxjs";
import { User } from "../../models";

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    private readonly router = inject(Router);
    private readonly http = inject(HttpClient);

    public currentUser: User | null = null;
    public serverError: boolean = false;
    private backendUrl = 'http://localhost:3000';
    
    public get authToken() : string | null {
        return sessionStorage.getItem('example_token');
    }

    public getUser(token: string) {
        let baseUrl = this.backendUrl + '/api/user';

        return this.http.get<User | null>(baseUrl, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .pipe(
                tap((response) => {
                    this.currentUser = response;
                }),
                catchError((error: HttpErrorResponse) => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this.login();
                    } else {
                        this.serverError = true;
                    }
                    return of(null);
                })
            );
    }

    public getAccessAndUser(accessToken: string): void {
        let backendUrl = '';

    }

    public login(): void {
        this.router.navigate(['login']);
    }
}