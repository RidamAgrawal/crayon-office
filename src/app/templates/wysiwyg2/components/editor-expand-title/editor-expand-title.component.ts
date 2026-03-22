import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'editor-expand-title',
  standalone: true,
  templateUrl: './editor-expand-title.component.html',
  styleUrl: './editor-expand-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorExpandTitleComponent {
  @Input() title!: string;
  @Input() expanded!: boolean;
  @Input() onToggle!: (e: MouseEvent) => void;
  @Input() onTitleChange!: (title: string) => void;

  contentSlot = viewChild<ElementRef<HTMLDivElement>>('contentSlot');
  // // ── Add these ──────────────────────────────────────────────
  // @ViewChild('toolbar', { static: true })
  // toolbarRef!: ElementRef<HTMLDivElement>;

  // private hostEl!: HTMLElement;

  // constructor(
  //   private el: ElementRef,
  //   private ngZone: NgZone,
  // ) {}

  // ngOnInit() {
  //   this.hostEl = this.el.nativeElement as HTMLElement;

  //   this.ngZone.runOutsideAngular(() => {
  //     // ✅ Show on mouse hover
  //     this.hostEl.addEventListener('mouseenter', this.showToolbar);
  //     this.hostEl.addEventListener('mouseleave', this.hideToolbarOnLeave);

  //     // ✅ Show when cursor is inside content (keyboard navigation / click)
  //     this.hostEl.addEventListener('focusin', this.showToolbar);
  //     this.hostEl.addEventListener('focusout', this.hideToolbarOnLeave);
  //   });
  // }

  // ngOnDestroy() {
  //   this.hostEl.removeEventListener('mouseenter', this.showToolbar);
  //   this.hostEl.removeEventListener('mouseleave', this.hideToolbarOnLeave);
  //   this.hostEl.removeEventListener('focusin', this.showToolbar);
  //   this.hostEl.removeEventListener('focusout', this.hideToolbarOnLeave);
  // }

  // private showToolbar = () => {
  //   this.toolbarRef.nativeElement.style.display = 'flex';
  // };

  // private hideToolbarOnLeave = (e: MouseEvent | FocusEvent) => {
  //   // Don't hide if focus/mouse moved to another element still inside host
  //   const related = (e as any).relatedTarget as HTMLElement | null;
  //   if (related && this.hostEl.contains(related)) return;
  //   this.toolbarRef.nativeElement.style.display = 'none';
  // };
  // @Output() copyNode = new EventEmitter<void>();
  // @Output() deleteNode = new EventEmitter<void>();

  // onCopy(e: MouseEvent) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   this.ngZone.run(() => this.copyNode.emit());
  // }

  // onDelete(e: MouseEvent) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   this.ngZone.run(() => this.deleteNode.emit());
  // }
}
