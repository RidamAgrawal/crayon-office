import { ElementRef, inject, Injectable } from '@angular/core';
import {
  OptionConfigurations,
  OptionsList,
} from '../../../../../templates/option-wrapper/option-wrapper.model';
import { OverlayService } from '../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../templates/option-wrapper/option-wrapper';

@Injectable({
  providedIn: 'any',
})
export class DashboardSpaceHeaderService {
  private readonly overlayService = inject(OverlayService);

  public handleMoreOptionsClick(
    element: HTMLButtonElement,
    optionLists: OptionsList[],
    onAction?: (action: OptionConfigurations) => void,
  ): void {
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists: structuredClone(optionLists),
          handleOptionEvent: (action: OptionConfigurations) => {
            onAction?.(action) ?? this.actionEventHandler(action);
          },
        },
      },
      connectedTo: new ElementRef(element),
      positions: [
        {
          originX: 'start',
          overlayX: 'start',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 10,
          offsetX: -6,
        },
      ],
    });
  }

  public actionEventHandler(action: OptionConfigurations): void {
    switch (action.id) {
      case 'addPeople':
        break;
    }
  }
}
