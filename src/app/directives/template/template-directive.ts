import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appTemplateDirective]'
})
export class TemplateDirective {

  constructor(
    public viewContainerRef: ViewContainerRef
  ) { }

}
