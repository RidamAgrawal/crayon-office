import { Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-icon-container',
  standalone: false,
  templateUrl: './icon-container.html',
  styleUrl: './icon-container.scss',
  exportAs: 'elementRef',
  host: {
    '[attr.tabindex]': '0'
  }
})
export class IconContainer {

  constructor(
    public elementRef: ElementRef
  ) { }
}
