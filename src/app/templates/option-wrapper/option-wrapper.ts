import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-option-wrapper',
  imports: [CommonModule],
  templateUrl: './option-wrapper.html',
  styleUrl: './option-wrapper.scss',
  host: {
    '[style.--option-hover-indication]': 'optionListsConfig.optionHoverIndication ? "inset 2px 0 0 #1868db" : "none"'
  }
})
export class OptionWrapper {
 @Input() optionListsConfig: any;
 public handleOptionEvent(action: any, optionElRef: HTMLElement) {
  action.elementRef = new ElementRef(optionElRef);
  this.optionListsConfig.handleOptionEvent(action);
 }
}
