import { Component, ElementRef, Input, signal, ViewChild, WritableSignal } from '@angular/core';
import { NavButtonConfig } from './nav-menu-btn.model';

@Component({
  selector: 'app-nav-menu-btn',
  imports: [],
  templateUrl: './nav-menu-btn.html',
  styleUrl: './nav-menu-btn.scss'
})
export class NavMenuBtn {
  @Input() config!: NavButtonConfig;
  showPlaceholder: WritableSignal<boolean> = signal(false);
  @ViewChild('btn',{static: true}) btn!: ElementRef<HTMLButtonElement>;
  @ViewChild('colContainer',{static: false}) colContainer!: ElementRef<HTMLDivElement>;
  
  public showToggle() {
    this.showPlaceholder.update(s => !s);
    if(this.showPlaceholder()){
      setTimeout(()=>{
        this.colContainer.nativeElement.focus();
      });
    }
  }
  public focusOut(event: FocusEvent){
    if(event.relatedTarget){
      if(event.relatedTarget == this.btn.nativeElement){return;}
      if(this.colContainer.nativeElement.contains(event.relatedTarget as Node)){this.colContainer.nativeElement.focus();return;}
    }
    this.showPlaceholder.set(false);
  }
}
