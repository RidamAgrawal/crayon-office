import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  resource,
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
import { JsonPipe, LowerCasePipe } from '@angular/common';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { WysiwygEditorWrapperComponent } from '../wysiwyg-editor-wrapper';
import { HttpService } from '../../../../../../services/http-service/http-service';
import { WorkItemModalTextFieldWrapperComponent } from '../text-field-wrapper';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { OptionConfigurations, OptionsList } from '../../../../../../templates/option-wrapper/option-wrapper.model';
import { rippleStyle, StatusLabels, StatusOptionsList } from './work-item-modal.constants';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

export interface SpaceStatusOptionConfigurations extends OptionConfigurations {
  name: string;
  backgroundColor: string;
}

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
    LowerCasePipe,
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
  protected readonly spaceOptionTemplate = viewChild<TemplateRef<any>>('spaceOptionTemplate');
  protected readonly statusBtn = viewChild<ElementRef<HTMLButtonElement>>('statusBtn');

  private readonly spaces = signal<{ id: string; name: string; key: string, icon: string }[]>([]);

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
          icon: s.icon,
          type: 'button',
          visible: true,
          contentTemplateRef: this.spaceOptionTemplate(),
        })),
      },
    ],
    isMultiSelect: false,
    optionHoverIndication: true,
  }));

  protected readonly selectedSpace = toSignal(
    this.createWorkItemForm.controls.space.valueChanges
  );

  protected readonly selectedSpaceStatuses = rxResource({
    params: () => this.selectedSpace() ?? undefined,
    stream: ({ params: spaceId }) => this.httpService.getSpaceColumns(spaceId),
    defaultValue: [],
  });

  protected readonly selectedStatus = signal<SpaceStatusOptionConfigurations | null>(null);

  protected readonly statusRippleEffects = computed(() => ({ ...rippleStyle, "box-shadow": `0 0 0 0 ${this.selectedStatus()?.backgroundColor}`, "background-color": this.selectedStatus()?.backgroundColor }));

  private statusBtnRippleEffect = effect(() => {
    const status = this.selectedStatus();
    const btn = this.statusBtn()?.nativeElement;
    if (!status || !btn) return;

    btn.animate([
      { boxShadow: `0 0 0 0 ${status.backgroundColor}` },
      { boxShadow: '0 0 0 10px transparent' },
    ],
      { duration: 1450, easing: 'cubic-bezier(.5, 0, 0, 1)' },
    );
  });
  
  public ngOnInit(): void {
    this.httpService.getSpaces().subscribe({
      next: (spaces) => {
        this.spaces.set(spaces);
        if (spaces.length > 0) {
          this.createWorkItemForm.controls.space.setValue(spaces[0].id);
        }
      },
      error: (err) => console.error('Failed to load spaces:', err),
    });
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
    debugger
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists: this.buildStatusOptionsList(),
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
        },
        {
          originX: 'start',
          overlayX: 'start',
          originY: 'top',
          overlayY: 'bottom',
          offsetY: -8,
        }
      ],
      viewContainerRef: this.viewContainerRef,
    });
  }

  private actionEventHandler(option: SpaceStatusOptionConfigurations): void {
    switch (option.id) {
      case 'createStatus':
        break;
      case 'editStatus':
        break;
      default:
        this.createWorkItemForm.controls.status.setValue(option.id ?? '');
        this.selectedStatus.set(option);
        this.overlayService.close();
    }
  }

  private buildStatusOptionsList(): OptionsList[] {
    StatusOptionsList[0].options = this.selectedSpaceStatuses.value()
      .map((status: SpaceStatusOptionConfigurations) => {
        status.visible = true;
        status.type = 'button';
        status.contentTemplateRef = this.statusOptionTabletTemplate();
        return status;
      });
    return StatusOptionsList;
  }
}
