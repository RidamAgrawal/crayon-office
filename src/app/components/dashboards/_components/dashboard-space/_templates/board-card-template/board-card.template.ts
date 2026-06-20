import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { cardMoreOptionButton } from './board-card.constants';
import { ClickOutside } from '../../../../../../directives';
import { BoardSpaceTextFieldWrapperTemplate } from '../board-space-text-field-wrapper-template';
import { WorkItem } from '../../../../_models';
import { DashboardSpaceBoardViewService } from '../../_services';

@Component({
  selector: 'board-view-card-template',
  templateUrl: './board-card.template.html',
  styleUrl: './board-card.template.scss',
  imports: [BoardSpaceTextFieldWrapperTemplate, ClickOutside],
})
export class BoardViewCardTemplate {
  private readonly overlayService = inject(OverlayService);
  private readonly boardViewService = inject(DashboardSpaceBoardViewService);

  public issue = input<WorkItem>();

  protected readonly isEditing: WritableSignal<boolean> = signal(false);
  protected readonly summary: WritableSignal<string> = signal('');
  protected readonly draftWorkType: WritableSignal<string> = signal('epic');

  public ngOnInit(): void {
    this.summary.set(this.issue()?.summary ?? '');
  }

  protected onCardOptionClick(event: MouseEvent, cardOptionBtnElement: HTMLButtonElement) {
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
    event.stopPropagation();
  }

  protected updateSummary(): void {
    this.isEditing.set(false);
    // make api call here
  }

  protected onSubmit(val: string): void {
    this.issue()!['summary'] = val;
    this.updateSummary();
  }

  @HostListener('click')
  protected onCardClick() {
    const key = this.issue()?.key;
    if (key) this.boardViewService.openWorkItemDetailModal(key);
  }
}
