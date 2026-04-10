import { Routes } from '@angular/router';
import { authGuard } from './services/authentication/auth-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/landing/landing')
            .then(c => c.Landing),
    },
    {
        path: 'login',
        loadComponent: () => import('./components/login/login')
            .then(c => c.Login),
        data: ['login']
    },
    {
        path: 'resetPassword',
        loadComponent: () => import('./components/login/login')
            .then(c => c.Login),
        data: ['reset']
    },
    {
        path: 'signup',
        loadComponent: () => import('./components/login/login')
            .then(c => c.Login),
        data: ['signup']
    },
    {
        path: 'app',
        loadChildren: () => import('./components/dashboards/dashboards-module')
            .then(m => m.DashboardsModule),
        canActivate: [authGuard]
    }
];
