import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Api } from './api/api';
import { Observable } from 'rxjs';
import { UserLoginSuccessResponse } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private http: HttpClient, private api: Api) { }
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
    const apiUrl = 'http://localhost:3000/api/auth/login';
    return this.http.post<UserLoginSuccessResponse>(apiUrl, { email, password });
  }

  public sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('http://localhost:3000/api/auth/signup/send-otp', { email });
  }

  public verifyOtp(email: string, code: string, displayName: string, password: string): Observable<UserLoginSuccessResponse> {
    return this.http.post<UserLoginSuccessResponse>('http://localhost:3000/api/auth/signup/verify-otp', { email, code, displayName, password });
  }
}
