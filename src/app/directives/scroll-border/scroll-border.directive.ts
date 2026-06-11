import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

const BORDER_TOP = '2px solid #0b120e24';
const BORDER_BOTTOM = '2px solid #0B120E24';

@Directive({
  selector: '[appScrollBorder]',
})
export class ScrollBorder implements AfterViewInit, OnDestroy {
  private readonly el: HTMLElement;
  private resizeObserver: ResizeObserver;

  constructor(ref: ElementRef<HTMLElement>) {
    this.el = ref.nativeElement;
    this.resizeObserver = new ResizeObserver(() => this.update());
  }

  ngAfterViewInit() {
    this.resizeObserver.observe(this.el);
    this.update();
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }

  @HostListener('scroll')
  update() {
    const { scrollTop, scrollHeight, clientHeight } = this.el;
    this.el.style.borderBlockStart = scrollTop > 0 ? BORDER_TOP : '';
    this.el.style.borderBlockEnd = scrollTop + clientHeight < scrollHeight - 1 ? BORDER_BOTTOM : '';
  }
}
