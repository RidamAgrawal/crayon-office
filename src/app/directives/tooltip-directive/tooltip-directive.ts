import { Directive, ElementRef, HostListener, Input, Optional, Self, SkipSelf } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
export interface AppTooltipConfig {
  text?: string;
  position?: 'above' | 'below' | 'left' | 'right' | 'after' | 'before';
  showDelay?: number;
  hideDelay?: number;
  disabled?: boolean;
}
@Directive({
  selector: '[appTooltipDirective]',
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: [
        'matTooltip: tooltipText',
        'matTooltipPosition: tooltipPosition',
        'matTooltipShowDelay: tooltipShowDelay',
        'matTooltipHideDelay: tooltipHideDelay',
        'matTooltipDisabled: tooltipDisabled',
      ],
    },
  ],
})
export class TooltipDirective {
  @Input('appTooltipDirective') 
  set tooltipConfig(value: AppTooltipConfig | string | null) {
    if (!value) {
      this.matTooltip.disabled = true;
      return;
    }
    if (typeof value == 'string') {
      this.matTooltip.message = value;
      this.matTooltip.disabled = false;
      return;
    }

    this.matTooltip.message = value.text;
    this.matTooltip.position = value.position ?? 'above';
    this.matTooltip.showDelay = value.showDelay ?? 0;
    this.matTooltip.hideDelay = value.hideDelay ?? 0;
    this.matTooltip.disabled = value.disabled ?? !value.text;
  }
  public parentTooltipDisabledByChild: boolean = false;

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.parentTooltip) {
      this.parentTooltip.hideFromChild();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.parentTooltip) {
      this.parentTooltip.restoreFromChild();
    }
  }

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private matTooltip: MatTooltip,
    @Optional() @SkipSelf() private parentTooltip?: TooltipDirective
  ) {}

  ngAfterViewInit() {
    this.syncDisabledState();
  }

  private syncDisabledState() {
    const nativeEl = this.elementRef.nativeElement as HTMLButtonElement;
    if(nativeEl.hasOwnProperty('disabled')) {
      this.matTooltip.disabled = nativeEl.disabled;
    }
  }

  hideFromChild() {
    if(this.parentTooltipDisabledByChild) return;
    if (!this.matTooltip.disabled) {
      this.parentTooltipDisabledByChild = true;
      queueMicrotask(() => {
        this.matTooltip.hide(0);
        this.matTooltip.disabled = true;
      });
    }
  }

  restoreFromChild() {
    if (this.parentTooltipDisabledByChild) {
      this.matTooltip.disabled = false;
      this.parentTooltipDisabledByChild = false;
    }
  }
}
