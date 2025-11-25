import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  ElementRef,
  Renderer2,
  EmbeddedViewRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';


@Directive({
  selector: '[appFloatingContainer]'
})
export class FloatingContainerDirective implements AfterViewInit, OnDestroy {
  @Input('appFloatingContainer') templateRef!: TemplateRef<any>;

  private containerEl?: HTMLElement;
  private viewRef?: EmbeddedViewRef<any>;
  private resizeObserver?: ResizeObserver;

  constructor(
    private host: ElementRef,
    private renderer: Renderer2,
    private viewContainer: ViewContainerRef
  ) {}

  ngAfterViewInit() {
    this.createContainer();
  }

  private createContainer() {
    const hostEl = this.host.nativeElement as HTMLElement;
    const rect = hostEl.getBoundingClientRect();

    // Create container
    this.containerEl = this.renderer.createElement('div') as HTMLElement;
    this.renderer.setStyle(this.containerEl, 'position', 'fixed');
    this.renderer.setStyle(this.containerEl, 'top', `${rect.bottom + 8}px`); // margin 8px below
    this.renderer.setStyle(this.containerEl, 'left', `${rect.left}px`);
    this.renderer.setStyle(this.containerEl, 'width', `${rect.width}px`);
    this.renderer.setStyle(this.containerEl, 'z-index', '1000');

    document.body.appendChild(this.containerEl);

    // Render the template inside the container
    this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef);
    this.viewRef.rootNodes.forEach(node => this.containerEl?.appendChild(node));

    // Observe host size changes to update position dynamically
    this.resizeObserver = new ResizeObserver(() => this.updatePosition());
    this.resizeObserver.observe(hostEl);

    window.addEventListener('scroll', this.updatePosition, true);
    window.addEventListener('resize', this.updatePosition, true);
  }

  private updatePosition = () => {
    if (!this.containerEl) return;
    const hostEl = this.host.nativeElement as HTMLElement;
    const rect = hostEl.getBoundingClientRect();

    this.renderer.setStyle(this.containerEl, 'top', `${rect.bottom + 8}px`);
    this.renderer.setStyle(this.containerEl, 'left', `${rect.left}px`);
    this.renderer.setStyle(this.containerEl, 'width', `${rect.width}px`);
  };

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('scroll', this.updatePosition, true);
    window.removeEventListener('resize', this.updatePosition, true);
    if (this.containerEl) document.body.removeChild(this.containerEl);
    this.viewRef?.destroy();
  }
}