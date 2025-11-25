import { Component } from '@angular/core';
import { Listing } from '../../listing/listing';
import { MultiSelect } from '../../multi-select/multi-select';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export enum LAST_UPDATED {
  'anyTime' = 'Any Time',
  'today' = 'Today',
  'yesterday' = 'Yesterday',
  'past7days' = 'Past 7 Days',
  'past30days' = 'Past 30 Days',
  'pastYear' = 'Past Year',
}

@Component({
  selector: 'app-jira-tab',
  imports: [Listing, MultiSelect, ɵInternalFormsSharedModule, ReactiveFormsModule, CommonModule],
  templateUrl: './jira-tab.html',
  styleUrl: './jira-tab.scss'
})
export class JiraTab {
  lastUpdatedOptions = Object.entries(LAST_UPDATED);
  status = ['done','open'];
  filterFormGroup!: FormGroup;
  constructor(private formBuilder: FormBuilder){}
  ngOnInit(){
    this.filterFormGroup = this.formBuilder.group({
      'lastUpdated': this.formBuilder.control<keyof typeof LAST_UPDATED>('anyTime'),
      'project': this.formBuilder.array([]),
      'assignee': this.formBuilder.array([]),
      'reporter': this.formBuilder.array([]),
      'status': this.formBuilder.array([]),
    })
  }
  public onStatusSelect(event: Event){
    const checkbox = event.target as HTMLInputElement;
    const statusFormArray = this.filterFormGroup.get('status') as FormArray;
    if(checkbox.checked){
      statusFormArray.push(this.formBuilder.control(checkbox.value));
    }
    else{
      const index = statusFormArray.controls.findIndex((control: AbstractControl) => control.value == checkbox.value);
      if(index != -1) statusFormArray.removeAt(index);
    }
  }
}
