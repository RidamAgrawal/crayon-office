import { Component, HostListener, Input, signal, Signal, WritableSignal } from '@angular/core';
import { NavDropdownConfig } from './nav-dropdown.model';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/compiler';

@Component({
  selector: 'app-nav-dropdown',
  imports: [CommonModule],
  templateUrl: './nav-dropdown.html',
  styleUrl: './nav-dropdown.scss',
})
export class NavDropdown {
  showPlaceholder: WritableSignal<boolean> = signal(false);
  @Input() config!: NavDropdownConfig;
  @HostListener('mouseenter')
  @HostListener('mouseleave')
  showToggle() {
    this.showPlaceholder.update(show => !show);
  }
}
