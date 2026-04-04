import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { AppInitService } from './services/app-init/app-init.service';

export function appInitFactory(appInitService: AppInitService) {
  return () => appInitService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    AppInitService,
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAppInitializer(() => appInitFactory(inject(AppInitService))())
  ]
};
