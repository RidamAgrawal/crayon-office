import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-toggle-btn',
  imports: [CommonModule],
  templateUrl: './toggle-btn.html',
  styleUrl: './toggle-btn.scss',
  host: {
    '[style.--toggle-background]': 'this._value() ? "#5B7F24" : "#292A2E"',
    '[style.--toggle-background-hover]': 'this._value() ? "#4C6B1F" : "#3B3D42"',
    '[style.--toggle-translate]': 'this._value() ? "translateX(1rem)" : "translateX(0rem)"',
  }
})
export class ToggleBtn {
  public _value: WritableSignal<boolean> = signal(false);
  @Input() set value(val: boolean){
    this._value.set(val);
  }
  get value(): boolean {
    return this._value();
  }
  @HostListener('click')
  public toggle() {
    this._value.update((val: boolean)=>!val);
  }
}
