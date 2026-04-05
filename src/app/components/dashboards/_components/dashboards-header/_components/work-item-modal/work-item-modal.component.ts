import { Component, inject } from "@angular/core";
import { IconContainer } from "../../../icon-container/icon-container";
import { MultiSelect } from "../../../../../../templates/multi-select/multi-select";
import { Wysiwyg2 } from "../../../../../../templates/wysiwyg2/wysiwyg2";
import { Checkbox } from "../../../../../../templates/checkbox/checkbox";
import { ScrollBorder } from "../../../../../../directives/scroll-border/scroll-border.directive";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MultiSelectWrapper } from "../multi-select-wrapper";
import { JsonPipe } from "@angular/common";

@Component({
    selector: 'app-work-item-modal',
    templateUrl: './work-item-modal.component.html',
    styleUrl: './work-item-modal.component.scss',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        IconContainer,
        MultiSelect,
        Wysiwyg2,
        Checkbox,
        ScrollBorder,
        MultiSelectWrapper,
        JsonPipe
    ]
})
export class WorkItemModalComponent {
    private readonly formBuilder = inject(FormBuilder);

    createWorkItemForm = this.formBuilder.group({
        space: ['', Validators.required],
        workType: ['', Validators.required],
        status: [''],
        summary: ['', Validators.required],
        description: ['']
    });

    protected readonly workTypeConfig = {
    placeholder: 'Select label',
    optionLists: [
      {
        heading: "All labels",
        options: [
          {
            label: "Task",
            icon: 'checkOutlineSquare',
            type: 'button',
            visible: true
          },
          {
            label: "Epic",
            icon: 'spaces',
            type: 'button',
            visible: true
          }
        ]
      },
      {
        options: [
          {
            label: "Add work type",
            type: 'button',
            visible: true
          },
          {
            label: "Edit work type",
            type: 'button',
            visible: true
          }
        ]
      }
    ],
    isMultiSelect: false,
    optionHoverIndication: true
  }
}