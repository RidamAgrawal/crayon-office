import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ModalService } from '../../services/modal-service/modal-service';

@Component({
  selector: 'app-dashboards',
  standalone: false,
  templateUrl: './dashboards.html',
  styleUrl: './dashboards.scss'
})
export class Dashboards {
  @ViewChild('modal', { read: TemplateRef, static: true }) modalTemplate!: TemplateRef<any>;
  constructor(private vcr: ViewContainerRef, private modalService: ModalService) { }
  ngOnInit() {
    this.modalService.dashboardCompRef = this;
  }
  public openModal(modalConfig: any) {
    this.vcr.clear();
    this.vcr.createEmbeddedView(this.modalTemplate, modalConfig);
  }
  public dismissModal() {
    this.vcr.clear();
  }
}
