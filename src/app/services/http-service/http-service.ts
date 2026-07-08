import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Api } from './api/api';
import { Observable } from 'rxjs';
import { UserLoginSuccessResponse } from '../../models';
import { environment } from '../../../environments/environment';
import {
  SpaceDetails,
} from '../../components/dashboards/_components/dashboard-space/_models';
import { SpaceBoardColumn } from '../../components/dashboards/_components/dashboard-space/_models/index';
import { WorkItem } from '../../components/dashboards/_models';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(
    private http: HttpClient,
    private api: Api,
  ) {}
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

  public login(email: string, password: string): Observable<UserLoginSuccessResponse | null> {
    const apiUrl = `${environment.backendUrl}/api/auth/login`;
    return this.http.post<UserLoginSuccessResponse>(apiUrl, {
      email,
      password,
    });
  }

  public sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.backendUrl}/api/auth/signup/send-otp`,
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
      `${environment.backendUrl}/api/auth/signup/verify-otp`,
      { email, code, displayName, password },
    );
  }

  public sendRecoveryLink(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.backendUrl}/api/auth/signup/send-recovery-link`,
      { email },
    );
  }

  public resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.backendUrl}/api/auth/reset-password`,
      { token, newPassword },
    );
  }

  public googleLogin(idToken: string): Observable<UserLoginSuccessResponse | null> {
    const apiUrl = `${environment.backendUrl}/api/auth/google`;
    return this.http.post<UserLoginSuccessResponse>(apiUrl, { idToken });
  }

  public microsoftLogin(idToken: string): Observable<UserLoginSuccessResponse | null> {
    return this.http.post<UserLoginSuccessResponse>(
      `${environment.backendUrl}/api/auth/microsoft`,
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

  public getWorkItems(spaceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.backendUrl}/api/work-items?spaceId=${spaceId}`);
  }

  public getSpaceHeaderDataAndSummary(spaceId: string): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/spaces/` + spaceId);
    // return this.http.get<any>(`./assets/data/spaceHeaderAndData.json`);
  }

  public getSpaceColumns(spaceId: string): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/spaces/` + spaceId + '/statuses');
  }

  public getSpaceIssues(spaceId: string): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/spaces/` + spaceId + '/issues');
  }

  public createStatus(
    spaceId: string,
    body: { name: string; label: string; backgroundColor: string; category?: string },
  ): Observable<SpaceBoardColumn> {
    return this.http.post<SpaceBoardColumn>(
      `${environment.backendUrl}/api/spaces/${spaceId}/statuses`,
      body,
    );
  }

  public updateStatus(
    spaceId: string,
    statusId: string,
    body: { name?: string; label?: string; backgroundColor?: string; category?: string },
  ): Observable<SpaceBoardColumn> {
    return this.http.patch<SpaceBoardColumn>(
      `${environment.backendUrl}/api/spaces/${spaceId}/statuses/${statusId}`,
      body,
    );
  }

  public updateIssue(
    spaceId: string,
    issueId: string,
    body: {
      summary?: string;
      statusId?: string;
      rank?: string;
      assigneeId?: string | null;
      description?: string;
      priority?: string;
    },
  ): Observable<WorkItem> {
    return this.http.patch<WorkItem>(
      `${environment.backendUrl}/api/spaces/${spaceId}/issues/${issueId}`,
      body,
    );
  }

  // http-service.ts
  public createIssue(
    spaceId: string,
    body: {
      summary: string;
      statusId: string;
      description?: string;
      workType?: string;
      dueDate?: string | null;
    },
  ): Observable<WorkItem> {
    return this.http.post<WorkItem>(`${environment.backendUrl}/api/spaces/${spaceId}/issues`, body);
  }

  public deleteStatus(
    spaceId: string,
    statusId: string,
    targetStatusId?: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${environment.backendUrl}/api/spaces/${spaceId}/statuses/${statusId}`,
      { body: { targetStatusId } }, // HttpClient supports body on DELETE
    );
  }

  public reorderStatuses(spaceId: string, orderedIds: string[]): Observable<any> {
    return this.http.post<any>(`${environment.backendUrl}/api/spaces/${spaceId}/statuses/reorder`, {
      orderedIds,
    });
  }

  public getIssueByKey(key: string): Observable<WorkItem> {
    return this.http.get<WorkItem>(`${environment.backendUrl}/api/work-items/by-key/${key}`);
  }
}
