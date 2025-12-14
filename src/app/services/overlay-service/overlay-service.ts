import { ConnectedPosition, Overlay, OverlayConfig, OverlayOutsideClickDispatcher, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { ComponentRef, ElementRef, Injectable, Injector, TemplateRef, Type, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';

export interface AppOverlayConfig {
  component?: Type<any>;
  template?: TemplateRef<any>;
  context?: any;
  viewContainerRef?: ViewContainerRef;
  data?: any;
  config?: OverlayConfig;
  connectedTo?: ElementRef;
  positions?: ConnectedPosition[];
  componentInputs?: any;
  componentOutputs?: any;
  closeOnBackdropClick?: boolean;
  backdropClass?: string | string[];
  hasBackdrop?: boolean;
  matchWidth?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  private overlayRef?: OverlayRef;
  private outsideClickSubscription?: Subscription;

  constructor(
    private overlay: Overlay,
    private outsideClickDispatcher: OverlayOutsideClickDispatcher,
    private injector: Injector
  ) { }

  public open(options: AppOverlayConfig): OverlayRef {

    let positionStrategy: PositionStrategy;
    let width: number | undefined;

    if (options.connectedTo) {
      positionStrategy = this.overlay.position()
        .flexibleConnectedTo(options.connectedTo)
        .withPositions(options.positions || []);
    }
    else {
      positionStrategy = this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically()
    }

    if(options.matchWidth && options.connectedTo){
      width = (options.connectedTo.nativeElement as HTMLElement)?.getBoundingClientRect()?.width;
    }

    const defaultConfig: OverlayConfig = new OverlayConfig({
      positionStrategy,
      width,
      hasBackdrop: options.hasBackdrop?? false,
      backdropClass: options.backdropClass,
      ...options.config
    });

    const overlayConfig = { ...defaultConfig, ...(options.config || {}) };
    this.overlayRef = this.overlay.create(overlayConfig);

    if(options.closeOnBackdropClick){
      this.overlayRef.backdropClick().subscribe(() => this.close());
    }

    if (options.template) {
      if (!options.viewContainerRef) {
        throw new Error('viewContainerRef is required when using Template');
      }
      const templatePortal = new TemplatePortal(options.template, options.viewContainerRef, options.context);
      this.overlayRef.attach(templatePortal);
      this.outsideClickSubscription = this.overlayRef.
        _outsidePointerEvents
        .subscribe(() => { this.close(); });
    }

    if (options.component) {
      const injector = Injector.create({
        providers: [{ provide: 'OVERLAY_DATA', useValue: options.data }],
        parent: this.injector
      });
      const portal = new ComponentPortal(options.component, null, injector);
      const componentRef = this.overlayRef.attach(portal);

      this.bindComponentInputs(componentRef, options.componentInputs);
      if (options.componentOutputs) {
        Object.keys(options.componentOutputs).forEach((outputProperty: string) => {
          const output = componentRef.instance?.[outputProperty];
          if (output && output.subscribe) {
            output.subscribe(options.componentOutputs[outputProperty]);
          }
        })
      }
    }
    return this.overlayRef;
  }

  public close() {
    if (this.overlayRef) {
      this.outsideClickDispatcher.remove(this.overlayRef);
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
    this.outsideClickSubscription?.unsubscribe();
  }

  public bindComponentInputs(componentRef: ComponentRef<any>, componentInputs: any) {
    if (!componentInputs) return;
    Object.keys(componentInputs).forEach((inputProperty: string) => {
      componentRef.setInput(inputProperty, componentInputs[inputProperty]);
    });
  }

  public bindComponentOutputs() {

  }

  public ngOnDestroy() {
    this.close();
  }
}
