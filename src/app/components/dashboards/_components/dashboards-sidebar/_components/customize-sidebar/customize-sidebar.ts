import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ModalService } from '../../../../../../services/modal-service/modal-service';

@Component({
  selector: 'app-customize-sidebar',
  standalone: false,
  templateUrl: './customize-sidebar.html',
  styleUrl: './customize-sidebar.scss'
})
export class CustomizeSidebar {
  @Input({required: true}) externalLinks: any[]=[];
  @Input({required: true}) internalItems: any[]=[];
  @Output() saveChanges: EventEmitter<any> = new EventEmitter<any>();
  constructor(
    private modalService: ModalService
  ) { }

  public save(){
    this.saveChanges.emit({
      'externalLinks': this.externalLinks,
      'internalItems': this.internalItems,
    })
    this.modalService.closeDashboardModal();
  }
  public dismissModal() {
    this.modalService.closeDashboardModal();
  }
  public drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.externalLinks, event.previousIndex, event.currentIndex);
  }
  public drop2(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.internalItems, event.previousIndex, event.currentIndex);
  }
}
