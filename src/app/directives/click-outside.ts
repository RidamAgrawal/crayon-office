import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]'
})
export class ClickOutside {
  @Output() clickOutside: EventEmitter<void> = new EventEmitter(); 
  constructor(private elRef:ElementRef) { }

  @HostListener('document:click',['$event'])
  onClick(event:Event){
    const target = event.target;
    if(target && !this.elRef.nativeElement.contains(target)){
      this.clickOutside.emit();
    }
  }
}
