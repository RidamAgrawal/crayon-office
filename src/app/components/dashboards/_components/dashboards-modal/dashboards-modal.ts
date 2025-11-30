import { Component, ElementRef, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { Subject, Observable, merge } from 'rxjs';

@Component({
  selector: 'app-dashboards-modal',
  imports: [],
  templateUrl: './dashboards-modal.html',
  styleUrl: './dashboards-modal.scss'
})
export class DashboardsModal {
  @Input() modalConfig: any;
  @ViewChild('body', { static: true, read: ElementRef }) public body!: ElementRef<HTMLElement>;
  private componentOutputs$ = new Subject<any>();
  private componentRef: any;

  constructor(
    private vcr: ViewContainerRef
  ) { }

  ngOnInit() {
    if (this.modalConfig.isComponent && this.modalConfig.componentRef) {
      this.componentRef = this.vcr.createComponent(this.modalConfig.componentRef);
      this.body.nativeElement.appendChild(this.componentRef.location.nativeElement);

      // Set inputs
      this.bindComponentInputs();

      // Subscribe to outputs
      this.bindComponentOutputs();
    }
    else if (this.modalConfig.isTemplate && this.modalConfig.templateRef) {
      const templateRef = this.vcr.createEmbeddedView(this.modalConfig.templateRef);
      this.body.nativeElement.appendChild(templateRef.rootNodes[0]);
    }
  }

  private bindComponentInputs() {
    if (!this.componentRef) return;

    Object.keys(this.modalConfig?.inputs || {}).forEach((key: string) => {
      this.componentRef.setInput(key, this.modalConfig.inputs[key]);
    });
  }

  private bindComponentOutputs() {
    if (!this.componentRef) return;

    const componentInstance = this.componentRef.instance;
    const outputStreams: Observable<any>[] = [];

    // Get all properties of the component instance
    for (const key in componentInstance) {
      const property = componentInstance[key];
      // Check if property is an EventEmitter (has subscribe method)
      if (property && typeof property.subscribe === 'function') {
        outputStreams.push(
          new Observable(observer => {
            property.subscribe((data: any) => {
              observer.next({ eventName: key, data });
            });
          })
        );
      }
    }

    // Merge all output streams
    if (outputStreams.length > 0) {
      merge(...outputStreams).subscribe(output => {
        this.componentOutputs$.next(output);
      });
    }
  }

  public getComponentOutputs(): Observable<any> {
    return this.componentOutputs$.asObservable();
  }

  closeModal() {
    this.vcr.clear();
    this.componentOutputs$.complete();
  }

  ngOnDestroy() {
    this.vcr.clear();
    this.componentOutputs$.complete();
  }
}
