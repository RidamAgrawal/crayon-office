import { Component, ElementRef, inject, input, signal, WritableSignal } from '@angular/core';
import { WorkItem } from '../../_models';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { cardMoreOptionButton } from './board-card.constants';
import { TextField } from '../../../../../../templates/text-field/text-field';

@Component({
  selector: 'board-view-card-template',
  templateUrl: './board-card.template.html',
  styleUrl: './board-card.template.scss',
  imports: [TextField]
})
export class BoardViewCardTemplate {
  private readonly overlayService = inject(OverlayService);

  public issue = input<WorkItem>();

  protected readonly isEditing: WritableSignal<boolean> = signal(false);
  protected readonly summary: WritableSignal<string> = signal('');

  public ngOnInit(): void {
    this.summary.set(this.issue()?.summary ?? '');
  }

  protected onCardOptionClick(cardOptionBtnElement: HTMLButtonElement) {
    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(cardOptionBtnElement),
      closeOnBackdropClick: true,
      componentInputs: {
        optionListsConfig: cardMoreOptionButton
      },
      positions: [
        {
          overlayX: 'end',
          originX: 'start',
          overlayY: 'top',
          originY: 'top',
          offsetX: 8,
        }
      ]
    });
  }

  protected updateSummary(): void {
    this.issue()!['summary'] = this.summary();
    this.isEditing.set(false);
    // make api call here
  }
}
