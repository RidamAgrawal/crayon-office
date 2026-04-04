import { CanActivateFn } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);

  if (authService.currentUser) return true;
  if (authService.serverError) {
    console.error('server error please try again later');
  }
  return false;
};
