import { Component, ElementRef, signal, ViewChild, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-dashboard-search-bar',
  standalone: false,
  templateUrl: './dashboard-search-bar.html',
  styleUrl: './dashboard-search-bar.scss'
})
export class DashboardSearchBar {
  @ViewChild('searchBar', { static: true }) searchBar!: ElementRef;

  isFocused: WritableSignal<boolean> = signal(false);

  focusInput() {
    if (this.isFocused()) { return; }
    (this.searchBar.nativeElement as HTMLInputElement).focus();
    this.isFocused.set(true);
  }
  focusOut(){
    this.isFocused.set(false);
  }
}
