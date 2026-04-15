import { ValidationErrors } from "@angular/forms";
import { PublicClientApplication } from '@azure/msal-browser';
import googleOneTap from 'google-one-tap';
import { environment } from "../../../environments/environment";

export const validateEmail = (value: string): ValidationErrors | null => {
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

export const validatePassword = (value: string): ValidationErrors | null => {
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

const googleOptions = {
  client_id: environment.googleClientId,
  auto_select: false,
  cancel_on_tap_outside: false,
  context: 'signin' as const,
};

export function triggerGoogleSignIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    googleOneTap(googleOptions, (response: { credential: string }) => {
      resolve(response.credential);
    });
  });
}


const msalInstance = new PublicClientApplication({
  auth: {
    clientId: environment.microsoftClientId,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
});

// MSAL requires initialization before use
let msalReady: Promise<void> | null = null;

export async function triggerMicrosoftSignIn(): Promise<string> {
  if (!msalReady) msalReady = msalInstance.initialize();
  await msalReady;

  const result = await msalInstance.loginPopup({
    scopes: ['openid', 'profile', 'email'],
  });
  return result.idToken;
}

export function triggerGithubSignIn(): void {
  const clientId = environment.githubClientId;
  const redirectUri = encodeURIComponent(window.location.origin + '/login');
  window.location.href =
    `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
}

export function triggerLinkedinSignIn(): void {
  const clientId = environment.linkedinClientId;
  const redirectUri = encodeURIComponent(window.location.origin + '/login');
  const state = crypto.randomUUID(); // CSRF protection
  sessionStorage.setItem('linkedin_oauth_state', state);
  window.location.href =
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20profile%20email&state=${state}`;
}
