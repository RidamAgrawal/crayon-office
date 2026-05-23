import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { IconContainer } from '../../../icon-container/icon-container';
import { MultiSelect } from '../../../../../../templates/multi-select/multi-select';
import { Checkbox } from '../../../../../../templates/checkbox/checkbox';
import { ScrollBorder } from '../../../../../../directives/scroll-border/scroll-border.directive';
import {
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MultiSelectWrapper } from '../multi-select-wrapper';
import { JsonPipe } from '@angular/common';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { WysiwygEditorWrapperComponent } from '../wysiwyg-editor-wrapper';
import { HttpService } from '../../../../../../services/http-service/http-service';
import { WorkItemModalTextFieldWrapperComponent } from '../text-field-wrapper';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { OptionConfigurations } from '../../../../../../templates/option-wrapper/option-wrapper.model';
import { StatusLabels, StatusOptionsList } from './work-item-modal.constants';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-work-item-modal',
  templateUrl: './work-item-modal.component.html',
  styleUrl: './work-item-modal.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IconContainer,
    Checkbox,
    ScrollBorder,
    MultiSelectWrapper,
    JsonPipe,
    WysiwygEditorWrapperComponent,
    WorkItemModalTextFieldWrapperComponent,
  ],
})
export class WorkItemModalComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly overlayService = inject(OverlayService);
  private readonly httpService = inject(HttpService);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private readonly addWorkTypeTemplateRef =
    viewChild<TemplateRef<HTMLElement>>('addWorkType');
  private readonly editWorkTypeTemplateRef =
    viewChild<TemplateRef<HTMLElement>>('editWorkType');
  protected readonly statusOptionTabletTemplate = viewChild<TemplateRef<any>>('statusOptionTabletTemplate');

  private readonly spaces = signal<{ id: string; name: string; key: string }[]>([]);

  createWorkItemForm = this.formBuilder.group({
    space: ['', Validators.required],
    workType: ['', Validators.required],
    status: ['', Validators.required],
    summary: ['', Validators.required],
    description: [''],
  });

  protected readonly workTypeConfig = computed(() => ({
    placeholder: 'Select work type',
    optionLists: [
      {
        heading: 'All work types',
        options: [
          {
            id: 'TASK',
            label: 'Task',
            icon: 'checkOutlineSquare',
            type: 'button',
            visible: true,
          },
          {
            id: 'BUG',
            label: 'Bug',
            icon: 'spaces',
            type: 'button',
            visible: true,
          },
          {
            id: 'EPIC',
            label: 'Epic',
            icon: 'spaces',
            type: 'button',
            visible: true,
          },
          {
            id: 'STORY',
            label: 'Story',
            icon: 'spaces',
            type: 'button',
            visible: true,
          },
        ],
      },
      {
        options: [
          {
            type: 'button',
            visible: true,
            label: 'Add work type',
          },
          {
            type: 'button',
            visible: true,
            label: 'Edit work type',
          },
        ],
      },
    ],
    isMultiSelect: false,
    optionHoverIndication: true,
  }));

  protected readonly spaceConfig = computed(() => ({
    placeholder: 'Select Space',
    optionLists: [
      {
        heading: 'All available spaces',
        options: this.spaces().map((s) => ({
          id: s.id,
          label: `${s.name} (${s.key})`,
          icon: 'checkOutlineSquare',
          type: 'button',
          visible: true,
        })),
      },
    ],
    isMultiSelect: false,
    optionHoverIndication: true,
  }));

  protected readonly selectedStatus = computed(() => {
    const id = this.statusValue();
    return id ? StatusLabels[id] : StatusLabels['toDo'];
  });

  private readonly statusValue = toSignal(
    this.createWorkItemForm.controls.status.valueChanges,
    { initialValue: this.createWorkItemForm.controls.status.value },
  );

  ngOnInit(): void {
    this.httpService.getSpaces().subscribe({
      next: (spaces) => this.spaces.set(spaces),
      error: (err) => console.error('Failed to load spaces:', err),
    });
    StatusOptionsList[0].options.forEach(option => (option as any).contentTemplateRef = this.statusOptionTabletTemplate());
  }

  protected summaryValidator(val: string): ValidationErrors | null {
    if (!val) {
      return { invalidEmail: true, feedback: 'Summary is required', icon: 'warningRed' };
    }
    return null;
  }

  protected createWorkItem(): void {
    if (this.createWorkItemForm.invalid) return;

    const { space, workType, summary, description, status } = this.createWorkItemForm.value;

    this.httpService
      .createWorkItem({
        spaceId: space!,
        summary: summary!,
        workType: workType!,
        description: description || undefined,
        statusId: status || undefined,
      })
      .subscribe({
        next: () => this.overlayService.close(),
        error: (err) => console.error('Failed to create work item:', err),
      });
  }

  protected closeWorkItemModal(): void {
    this.overlayService.close();
  }

  protected onStatusClick(element: HTMLButtonElement): void {
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists: StatusOptionsList,
          handleOptionEvent: (action: any) => {
            this.actionEventHandler(action);
          },
        },
      },
      connectedTo: new ElementRef(element),
      positions: [
        {
          originX: 'start',
          overlayX: 'start',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 8,
        }
      ],
      viewContainerRef: this.viewContainerRef,
    });
  }

  private actionEventHandler(option: OptionConfigurations): void {
    switch (option.id) {
      case 'toDo':
      case 'inProgress':
      case 'done':
        this.createWorkItemForm.controls.status.setValue(option.id);
        this.overlayService.close();
        break;
      case 'createStatus':
        break;
      case 'editStatus':
        break;
    }
  }
}
