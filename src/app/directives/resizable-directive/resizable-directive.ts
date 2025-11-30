import { Directive, ElementRef, Input, NgZone, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appResizableDirective]'
})
export class ResizableDirective {

  @Input() config: any;

  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private unsubscribeMove: (() => void) | null = null;
  private unsubscribeUp: (() => void) | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) { }

  public ngOnInit() {
    if (!this.config || (!this.config.resizableTop && !this.config.resizableBottom && !this.config.resizableLeft && !this.config.resizableRight)) {
      console.warn('did not passed resize direction directive render nothing.');
      return; 
    }
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');

    if (this.config.resizableTop) {
      const handleWrapper = this.renderer.createElement('div');
      this.renderer.appendChild(handleWrapper, this.renderResizeHandles('top'));
      this.renderer.appendChild(this.el.nativeElement, handleWrapper);
    }

    if (this.config.resizableBottom) {
      const handleWrapper = this.renderer.createElement('div');
      this.renderer.appendChild(handleWrapper, this.renderResizeHandles('bottom'));
      this.renderer.appendChild(this.el.nativeElement, handleWrapper);
    }

    if (this.config.resizableLeft) {
      const handleWrapper = this.renderer.createElement('div');
      this.renderer.appendChild(handleWrapper, this.renderResizeHandles('left'));
      this.renderer.appendChild(this.el.nativeElement, handleWrapper);
    }

    if (this.config.resizableRight) {
      const handleWrapper = this.renderer.createElement('div');
      this.renderer.appendChild(handleWrapper, this.renderResizeHandles('right'));
      this.renderer.appendChild(this.el.nativeElement, handleWrapper);
    }
  }

  private startResize(event: PointerEvent, direction: 'horizontal' | 'vertical') {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.el.nativeElement.offsetWidth;
    this.startHeight = this.el.nativeElement.offsetHeight;

    // Listen to pointermove/up outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.unsubscribeMove = this.renderer.listen('document', 'pointermove', (e: PointerEvent) => {
        this.onPointerMove(e, direction);
      });
      this.unsubscribeUp = this.renderer.listen('document', 'pointerup', () => {
        this.onPointerUp();
      });
    });
  }

  private onPointerMove(event: PointerEvent, direction: 'horizontal' | 'vertical') {
    if (!this.isResizing) return;

    if (direction === 'horizontal') {
      const dx = event.clientX - this.startX;
      const newWidth = Math.min(this.config.maxWidth, Math.max(this.config.minWidth, this.startWidth + dx));
      this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
    } else {
      const dy = event.clientY - this.startY;
      const newHeight = Math.max(this.config.minHeight, this.startHeight + dy);
      this.renderer.setStyle(this.el.nativeElement, 'height', `${newHeight}px`);
    }
  }

  private onPointerUp() {
    this.isResizing = false;
    if (this.unsubscribeMove) { this.unsubscribeMove(); this.unsubscribeMove = null; }
    if (this.unsubscribeUp) { this.unsubscribeUp(); this.unsubscribeUp = null; }
  }

  public renderResizeHandles(handleOrientation: 'bottom' | 'left' | 'top' | 'right') {
    const handleContainer = this.renderer.createElement('div');
    this.renderer.addClass(handleContainer, 'slider-container-'+handleOrientation);
    this.renderer.addClass(handleContainer, 'slider-container');

    this.renderer.setStyle(handleContainer, 'position', 'absolute');
    this.renderer.setStyle(handleContainer, 'outline-width', 'medium');
    this.renderer.setStyle(handleContainer, 'outline-style', 'none');
    this.renderer.setStyle(handleContainer, 'z-index', '2');

    this.renderer.listen(handleContainer, 'pointerdown', (event: PointerEvent) => {
      if(handleOrientation == 'left' || handleOrientation == 'right') this.startResize(event, 'horizontal');
      else this.startResize(event, 'vertical');
    });

    const handle = this.renderer.createElement('div');
    this.renderer.addClass(handle, 'slider');
    this.renderer.addClass(handle, 'slider-'+handleOrientation);
    this.renderer.setStyle(handle, 'transition-delay', '0ms');
    this.renderer.setStyle(handle, 'transition-duration', '0.1s');
    this.renderer.setStyle(handle, 'transition-property', 'color');
    this.renderer.setStyle(handle, 'color', '0000');
    this.renderer.setStyle(handle, 'position', 'absolute');
    this.renderer.setStyle(handle, 'background-color', 'initial');
    this.renderer.setStyle(handle, 'padding-inline', '0px');
    this.renderer.setStyle(handle, 'padding-block', '0px');

    const handleIndicator = this.renderer.createElement('span');
    this.renderer.addClass(handleIndicator, 'handle-indicator-'+handleOrientation);
    this.renderer.setStyle(handleIndicator, 'background-color', 'currentColor');
    this.renderer.setStyle(handleIndicator, 'position', 'absolute');
    this.renderer.setStyle(handleIndicator, 'display', 'block');
    this.renderer.appendChild(handle, handleIndicator);

    this.renderer.appendChild(handleContainer, handle);

    const elRefWidth = this.el.nativeElement.clientWidth;

    switch (handleOrientation) {
      case 'left':
        this.renderer.setStyle(handleContainer, 'left', '0rem');
        this.renderer.setStyle(handleIndicator, 'inset-inline-start', '0rem');
        this.renderer.setStyle(handle, 'width', '1rem');
        this.renderer.setStyle(handleIndicator, 'width', '3px');
        this.renderer.setStyle(handleIndicator, 'height', '100%');
        this.renderer.setStyle(handle, 'cursor', 'ew-resize');
        break;
      case 'right':
        this.renderer.setStyle(handleContainer, 'inset-inline-end', '0.5rem');
        this.renderer.setStyle(handleIndicator, 'inset-inline-start', '0.5rem');
        this.renderer.setStyle(handle, 'width', '1rem');
        this.renderer.setStyle(handleIndicator, 'width', '3px');
        this.renderer.setStyle(handleIndicator, 'height', '100%');
        this.renderer.setStyle(handle, 'cursor', 'ew-resize');
        break;
      case 'top':
        this.renderer.setStyle(handleContainer, 'inset-block-start', '-0.5rem');
        this.renderer.setStyle(handleContainer, 'inset-inline-start', '0rem');
        this.renderer.setStyle(handleIndicator, 'inset-block-start', '0.5rem');
        this.renderer.setStyle(handle, 'height', '1rem');
        this.renderer.setStyle(handleIndicator, 'height', '3px');
        this.renderer.setStyle(handleIndicator, 'width', elRefWidth+'px');
        this.renderer.setStyle(handle, 'width', elRefWidth+'px');
        this.renderer.setStyle(handle, 'cursor', 'ns-resize');
        break;
      case 'bottom':
        this.renderer.setStyle(handleContainer, 'inset-block-start', '100%');
        this.renderer.setStyle(handleContainer, 'inset-inline-start', '0rem');
        this.renderer.setStyle(handleIndicator, 'inset-block-end', '0.5rem');
        this.renderer.setStyle(handle, 'height', '1rem');
        this.renderer.setStyle(handleIndicator, 'height', '3px');
        this.renderer.setStyle(handleIndicator, 'width', elRefWidth+'px');
        this.renderer.setStyle(handle, 'width', elRefWidth+'px');
        this.renderer.setStyle(handle, 'cursor', 'ns-resize');
        break;
    }

    return handleContainer;
  }

  public ngOnDestroy() {
    if (this.unsubscribeMove) this.unsubscribeMove();
    if (this.unsubscribeUp) this.unsubscribeUp();
  }
}
