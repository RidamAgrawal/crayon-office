import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  Signal,
  signal,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { OverlayService } from '../../services/overlay-service/overlay-service';
import { OverlayRef } from '@angular/cdk/overlay';
import { OptionWrapper } from '../option-wrapper/option-wrapper';
import {
  OptionConfigurations,
  OptionListsConfig,
  OptionsList,
} from '../option-wrapper/option-wrapper.model';

@Component({
  selector: 'app-multi-select',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [OverlayService],
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.scss',
})
export class MultiSelect implements OnChanges {
  @ViewChild('input', { static: true }) public inputElRef!: ElementRef<HTMLInputElement>;
  @ViewChild('optionContainer', { static: true }) public optionTemplateRef!: TemplateRef<any>;
  @Input() config: any = {
    placeholder: 'Select label',
    optionLists: [
      {
        heading: 'All labels',
        options: [
          {
            label: 'label 1',
            type: 'button',
            visible: true,
          },
          {
            label: 'label 2',
            type: 'button',
            visible: true,
          },
        ],
      },
      {
        heading: 'More labels',
        options: [
          {
            label: 'label 3',
            type: 'button',
            visible: true,
          },
          {
            label: 'label 4',
            type: 'button',
            visible: true,
          },
        ],
      },
    ],
    isMultiSelect: true,
    optionHoverIndication: true,
  };
  @Output() selected: EventEmitter<any> = new EventEmitter<any>();
  public inputControl!: FormControl<string | null>;

  public selectedOptions: WritableSignal<Set<OptionConfigurations>> = signal(
    new Set<OptionConfigurations>(),
  );

  public availOptions: WritableSignal<OptionsList[] | null> = signal(null);

  // Reactive signal for selected options array
  public selectedOptionsArray: Signal<OptionConfigurations[]> = computed(() =>
    Array.from(this.selectedOptions()),
  );

  public optionsOverlayRef: OverlayRef | null = null;
  constructor(
    private fb: FormBuilder,
    private changeRef: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef,
    private overlayService: OverlayService,
  ) {
    this.inputControl = this.fb.control('');
    effect(() => {
      this.availOptions();
    });
  }

  ngOnInit() {
    this.bindConfig();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) {
      this.bindConfig();
    }
  }

  private bindConfig() {
    if (!this.config) return;
    this.availOptions.set(this.config.optionLists);
    this.config.handleOptionEvent = (option: OptionConfigurations) => this.selectOption(option);
  }

  public focusIn() {
    this.inputElRef.nativeElement.focus();
    this.optionsOverlayRef = this.overlayService.open({
      component: OptionWrapper,
      connectedTo: this.elementRef,
      componentInputs: {
        optionListsConfig: this.config,
      },
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
        },
      ],
      viewContainerRef: this.viewContainerRef,
      matchWidth: true,
    });
  }
  public focusOut() {
    this.overlayService.close();
  }

  public toggleOptions() {
    this.optionsOverlayRef?.detach();
  }
  public selectOption(option: OptionConfigurations) {
    if (!this.config.isMultiSelect) {
      this.selectOneOption(option);
      return;
    }
    const currentSelected = this.selectedOptions();

    if (currentSelected.has(option)) {
      currentSelected.delete(option);
      option.visible = true;
    } else {
      currentSelected.add(option);
      option.visible = false;
    }

    // Trigger signal update
    this.selectedOptions.set(new Set(currentSelected));
  }
  public selectOneOption(option: OptionConfigurations) {
    if (this.selectedOptions().size) {
      this.selectedOptions().forEach((option) => (option.visible = true));
    }
    this.selectedOptions.set(new Set([option]));
    this.emitChange();
  }
  public clearOption(option: OptionConfigurations) {
    const currentSelected = this.selectedOptions();
    if (currentSelected.has(option)) {
      currentSelected.delete(option);
      option.visible = true;
      this.selectedOptions.set(new Set(currentSelected));
    }
    this.emitChange();
  }
  public clearAll() {
    this.selectedOptions().forEach((option) => (option.visible = true));
    this.selectedOptions.set(new Set());
    this.emitChange();
  }

  public getSelectedOptions() {
    return this.selectedOptionsArray();
  }

  public emitChange() {
    this.selected.emit(this.selectedOptionsArray());
  }
}
