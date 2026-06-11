import { Component, ElementRef, inject, input, signal, WritableSignal } from '@angular/core';
import { WorkItem } from '../../_models';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { cardMoreOptionButton } from './board-card.constants';
import { ClickOutside } from '../../../../../../directives';
import { BoardSpaceTextFieldWrapperTemplate } from '../board-space-text-field-wrapper-template';

@Component({
  selector: 'board-view-card-template',
  templateUrl: './board-card.template.html',
  styleUrl: './board-card.template.scss',
  imports: [BoardSpaceTextFieldWrapperTemplate, ClickOutside],
})
export class BoardViewCardTemplate {
  private readonly overlayService = inject(OverlayService);

  public issue = input<WorkItem>();

  protected readonly isEditing: WritableSignal<boolean> = signal(false);
  protected readonly summary: WritableSignal<string> = signal('');
  protected readonly draftWorkType: WritableSignal<string> = signal('epic');

  public ngOnInit(): void {
    this.summary.set(this.issue()?.summary ?? '');
  }

  protected onCardOptionClick(cardOptionBtnElement: HTMLButtonElement) {
    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(cardOptionBtnElement),
      closeOnBackdropClick: true,
      componentInputs: {
        optionListsConfig: cardMoreOptionButton,
      },
      positions: [
        {
          overlayX: 'end',
          originX: 'start',
          overlayY: 'top',
          originY: 'top',
          offsetX: 8,
        },
      ],
    });
  }

  protected updateSummary(): void {
    this.isEditing.set(false);
    // make api call here
  }

  protected onSubmit(val: string): void {
    this.issue()!['summary'] = val;
    this.updateSummary();
  }
}
