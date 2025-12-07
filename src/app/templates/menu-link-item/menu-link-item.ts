import { Component, Input, signal, WritableSignal } from '@angular/core';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-menu-link-item',
  imports: [CommonModule],
  templateUrl: './menu-link-item.html',
  styleUrl: './menu-link-item.scss'
})
export class MenuLinkItem {
  @Input({ required: true }) menuItemConfig: any;

  public showSublinks: WritableSignal<boolean> = signal<boolean>(false);

  public toggleSublinks(event: Event) {
    event.preventDefault();
    this.showSublinks.update((val) => !val);
  }
}
