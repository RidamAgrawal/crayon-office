import { Component, ElementRef, HostListener, signal, TemplateRef, ViewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { AppOverlayConfig, OverlayService } from '../../../../services/overlay-service/overlay-service';

@Component({
  selector: 'app-dashboard-search-bar',
  standalone: false,
  templateUrl: './dashboard-search-bar.html',
  styleUrl: './dashboard-search-bar.scss'
})
export class DashboardSearchBar {
  @ViewChild('searchBar', { static: true }) private searchBar!: ElementRef;
  @ViewChild('searchArea', { static: true }) private searchArea!: ElementRef<HTMLElement>;
  @ViewChild('overlayTemplate', { read:TemplateRef, static: true }) public searchDialogWrapper!: TemplateRef<any>;

  isFocused: WritableSignal<boolean> = signal(false);
  constructor(
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef
  ) { }
  @HostListener('click')
  focusInput() {
    if (this.isFocused()) { return; }
    (this.searchBar.nativeElement as HTMLInputElement).focus();
    this.isFocused.set(true);
    const overlayOptions: AppOverlayConfig = {
      viewContainerRef: this.viewContainerRef,
      template: this.searchDialogWrapper,
      connectedTo: this.searchArea,
      positions: [
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetX: 0, offsetY: 0 }
      ]
    }
    this.overlayService.open(overlayOptions);
  }
  focusOut() {
    this.isFocused.set(false);
    // this.overlayService.close();
  }
}
