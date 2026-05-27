import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';
import {
  OptionConfigurations,
  OptionListsConfig,
} from './option-wrapper.model';

@Directive({
  selector: '[insertElement]',
  standalone: true,
})
export class InsertElementDirective implements OnInit {
  @Input('insertElement') contentElementRef!: ElementRef;

  constructor(
    private hostEl: ElementRef,
    private renderer: Renderer2,
  ) { }

  ngOnInit() {
    if (this.contentElementRef?.nativeElement) {
      this.renderer.appendChild(
        this.hostEl.nativeElement,
        this.contentElementRef.nativeElement,
      );
    }
  }
}

@Component({
  selector: 'app-option-wrapper',
  imports: [CommonModule, NgTemplateOutlet, InsertElementDirective],
  templateUrl: './option-wrapper.html',
  styleUrl: './option-wrapper.scss',
  host: {
    '[style.--option-hover-indication]':
      'optionListsConfig.optionHoverIndication ? "inset 4px 0 0 #1868db" : "none"',
    '[style.--option-hover-border]':
      'optionListsConfig.optionHoverIndication ? "0.5px solid #1868db" : "none"',
    '[style.--option-hover-border-radius]':
      'optionListsConfig.optionHoverIndication ? "8px" : "4px"',
  },
})
export class OptionWrapper {
  @Input() optionListsConfig!: OptionListsConfig;
  public handleOptionEvent(
    action: OptionConfigurations,
    optionElRef: HTMLElement,
  ) {
    action.elementRef = new ElementRef(optionElRef);
    this.optionListsConfig.handleOptionEvent?.(action);
  }
}
