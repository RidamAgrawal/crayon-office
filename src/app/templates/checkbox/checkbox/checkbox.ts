import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-checkbox',
  imports: [FormsModule, CommonModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss'
})
export class Checkbox {
  @Input() public checkboxConfig: any;
  ngOnInit(){
    // if(!this.checkboxConfig||!this.checkboxConfig.hasOwnProperty('checked')){
    //   this.checkboxConfig = {checked: false};
    // }
  }
}
