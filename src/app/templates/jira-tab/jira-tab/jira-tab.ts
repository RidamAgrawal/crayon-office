import { Component } from '@angular/core';
import { Listing } from '../../listing/listing';
import { MultiSelect } from '../../multi-select/multi-select';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Checkbox } from '../../checkbox/checkbox/checkbox';

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
  imports: [Listing, MultiSelect, ɵInternalFormsSharedModule, ReactiveFormsModule, CommonModule, Checkbox],
  templateUrl: './jira-tab.html',
  styleUrl: './jira-tab.scss'
})
export class JiraTab {
  public lastUpdatedOptions = Object.entries(LAST_UPDATED);
  public status = ['done','open'];
  public filterFormGroup!: FormGroup;
  public labelFilterConfig = {
    placeholder:'Choose one',
    optionLists: [
      {
        options: [
          {label: 'label 1'},
          {label: 'label 2'}
        ],
        heading: 'All labels'
      }
    ]
  }
  constructor(private formBuilder: FormBuilder){}
  ngOnInit(){
    this.filterFormGroup = this.formBuilder.group({
      'lastUpdated': this.formBuilder.control<keyof typeof LAST_UPDATED>('anyTime'),
      'project': this.formBuilder.array([
        this.formBuilder.control<boolean>(false),
      ]),
      'assignee': this.formBuilder.array([
        this.formBuilder.control<boolean>(false),
      ]),
      'reporter': this.formBuilder.array([
        this.formBuilder.control<boolean>(false),
      ]),
      'status': this.formBuilder.array([
        this.formBuilder.control<boolean>(false),
        this.formBuilder.control<boolean>(false),
      ]),
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
