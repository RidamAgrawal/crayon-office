import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Api } from './api/api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private http: HttpClient,private api: Api){}
  public getSidebarItemConfig(): Observable<any> {
    return this.http.get(this.api.sidebarItemConfig);
  }
}
