import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Api } from './api/api';
import { Observable } from 'rxjs';
import { UserLoginSuccessResponse } from '../../models';
import { environment } from '../../../environments/environment';
import { SpaceDetails } from '../../components/dashboards/_components/dashboard-space/_models';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(
    private http: HttpClient,
    private api: Api,
  ) { }
  public getSidebarItemConfig(): Observable<any> {
    return this.http.get(this.api.sidebarItemConfig);
  }

  public getWysiwygEditorConfig(): Observable<any> {
    return this.http.get(this.api.wysiwygEditorConfig);
  }

  public getEmoji(): Observable<any> {
    return this.http.get(this.api.emoji);
  }

  public createItem(payload: any): Observable<any> {
    return this.http.post('/create/', payload);
  }

  public login(
    email: string,
    password: string,
  ): Observable<UserLoginSuccessResponse | null> {
    const apiUrl = 'http://localhost:3000/api/auth/login';
    return this.http.post<UserLoginSuccessResponse>(apiUrl, {
      email,
      password,
    });
  }

  public sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      'http://localhost:3000/api/auth/signup/send-otp',
      { email },
    );
  }

  public verifyOtp(
    email: string,
    code: string,
    displayName: string,
    password: string,
  ): Observable<UserLoginSuccessResponse> {
    return this.http.post<UserLoginSuccessResponse>(
      'http://localhost:3000/api/auth/signup/verify-otp',
      { email, code, displayName, password },
    );
  }

  public sendRecoveryLink(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      'http://localhost:3000/api/auth/signup/send-recovery-link',
      { email },
    );
  }

  public resetPassword(
    token: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      'http://localhost:3000/api/auth/reset-password',
      { token, newPassword },
    );
  }

  public googleLogin(
    idToken: string,
  ): Observable<UserLoginSuccessResponse | null> {
    const apiUrl = 'http://localhost:3000/api/auth/google';
    return this.http.post<UserLoginSuccessResponse>(apiUrl, { idToken });
  }

  public microsoftLogin(
    idToken: string,
  ): Observable<UserLoginSuccessResponse | null> {
    return this.http.post<UserLoginSuccessResponse>(
      'http://localhost:3000/api/auth/microsoft',
      { idToken },
    );
  }

  public githubLogin(code: string): Observable<UserLoginSuccessResponse> {
    return this.http.post<{ token: string; user: any }>(
      environment.backendUrl + '/api/auth/github',
      { code },
    );
  }

  public linkedinLogin(code: string): Observable<UserLoginSuccessResponse> {
    return this.http.post<{ token: string; user: any }>(
      environment.backendUrl + '/api/auth/linkedin',
      { code },
    );
  }

  // Spaces
  public getSpaces(): Observable<SpaceDetails[]> {
    return this.http.get<any[]>(`${environment.backendUrl}/api/spaces`);
  }

  public createSpace(name: string, key: string, icon: string): Observable<any> {
    return this.http.post(`${environment.backendUrl}/api/spaces`, {
      name,
      key,
      icon,
    });
  }

  // Work Items
  public createWorkItem(payload: {
    spaceId: string;
    summary: string;
    workType: string;
    description?: string;
    statusId?: string;
  }): Observable<any> {
    return this.http.post(`${environment.backendUrl}/api/work-items`, payload);
  }

  public getWorkItems(spaceId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.backendUrl}/api/work-items?spaceId=${spaceId}`,
    );
  }

  public getSpaceHeaderDataAndSummary(spaceId: string): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/spaces/` + spaceId);
    // return this.http.get<any>(`./assets/data/spaceHeaderAndData.json`);
  }

  public getSpaceColumns(spaceId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.backendUrl}/api/spaces/` + spaceId + '/statuses',
    );
  }

  public getSpaceIssues(spaceId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.backendUrl}/api/spaces/` + spaceId + '/issues',
    );
  }
}
