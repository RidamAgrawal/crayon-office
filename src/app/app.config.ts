import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppInitService } from './services/app-init/app-init.service';
import { JwtInterceptor } from './services/interceptor/jwt.interceptor';
import { provideStore } from '@ngrx/store';

export function appInitFactory(appInitService: AppInitService) {
  return () => appInitService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    AppInitService,
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAppInitializer(() => appInitFactory(inject(AppInitService))()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    provideStore(),
  ]
};
