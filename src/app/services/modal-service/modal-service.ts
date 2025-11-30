import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  public dashboardModal: Subject<any> = new Subject<any>();
  public dashboardCompRef: any;
  
  public openDashboardModal(modalConfig: any): Observable<any> {
    // this.dashboardModal.next(modalConfig);
    return this.dashboardCompRef?.openModal(modalConfig);
  }
  
  public closeDashboardModal(): void {
    this.dashboardCompRef?.dismissModal();
  }
}
