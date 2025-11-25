import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  public dashboardModal: Subject<any> = new Subject<any>();
  public dashboardCompRef: any;
  public openDashboardModal(modalConfig: any): void {
    // this.dashboardModal.next(modalConfig);
    this.dashboardCompRef?.openModal(modalConfig);
  }
  public closeDashboardModal(): void {
    this.dashboardCompRef?.dismissModal();
  }
}
