import { Component, ElementRef, inject, input } from '@angular/core';
import { WorkItem } from '../../_models';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { cardMoreOptionButton } from './board-card.constants';

@Component({
  selector: 'board-view-card-template',
  templateUrl: './board-card.template.html',
  styleUrl: './board-card.template.scss',
})
export class BoardViewCardTemplate {
  private readonly overlayService = inject(OverlayService);

  public issue = input<WorkItem>();

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
}
