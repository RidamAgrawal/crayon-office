declare module 'google-one-tap' {
  interface GoogleOneTapOptions {
    client_id: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }

  interface CredentialResponse {
    credential: string;
    select_by: string;
    client_id: string;
  }

  function googleOneTap(
    options: GoogleOneTapOptions,
    callback: (response: CredentialResponse) => void
  ): void;

  export default googleOneTap;
}
