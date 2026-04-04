import { inject, Injectable } from "@angular/core";
import { AuthenticationService } from "../authentication/authentication.service";

@Injectable({
    providedIn: 'any'
})
export class AppInitService {
    private authService = inject(AuthenticationService);
    public init() {
        const loginToken = sessionStorage.getItem('example_token');
        if (loginToken) {
            return this.authService.getUser(loginToken);
        }
        // const url = new URL(location.href);
        // const accessToken = url.searchParams.get('example_token');
        // if (accessToken) {
        //     url.searchParams.delete('example_token');
        //     history.replaceState({}, document.title, url.toString());
        //     return this.authService.getAccessAndUser(accessToken);
        // }
        return;
    }
}