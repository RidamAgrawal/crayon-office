import {
  Component,
  inject,
  viewChild,
  ViewContainerRef,
  TemplateRef,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { TextField } from '../../../../../../templates/text-field/text-field';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { SpaceBoardsModalFilterPosition, WORK_TYPES } from './dashboard-space-board-view.constants';
import { Checkbox } from '../../../../../../templates/checkbox/checkbox';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { BoardFilterState, SpaceBoardColumn } from '../../_models';
import { selectSpaceDetail } from '../../_store/dashboard-space-store.selector';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { BoardViewColumnTemplate } from '../../_templates/board-column-template';
import { FormsModule } from '@angular/forms';
import { NamePipe } from '../../../../../../pipes/name-pipe/name-pipe';
import { ClickOutside } from '../../../../../../directives';
import { OptionConfigurations } from '../../../../../../templates/option-wrapper/option-wrapper.model';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { BoardSpaceTextFieldWrapperTemplate } from '../../_templates/board-space-text-field-wrapper-template';
import {
  DashboardSpaceBoardViewService,
  DashboardSpaceBoardViewStateService,
} from '../../_services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkItem } from '../../../../_models';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'dashboard-space-board-view',
  templateUrl: './dashboard-space-board-view.component.html',
  styleUrl: './dashboard-space-board-view.component.scss',
  imports: [
    TextField,
    Checkbox,
    BoardViewColumnTemplate,
    DragDropModule,
    FormsModule,
    NamePipe,
    ClickOutside,
    BoardSpaceTextFieldWrapperTemplate,
  ],
  providers: [DashboardSpaceBoardViewService, DashboardSpaceBoardViewStateService],
})
export class DashboardSpaceBoardViewComponent {
  private readonly store = inject(Store);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayService = inject(OverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly boardViewState = inject(DashboardSpaceBoardViewStateService);
  protected readonly boardViewService = inject(DashboardSpaceBoardViewService);

  private filterModalTemplate = viewChild('filterModalTemplate', {
    read: TemplateRef<HTMLElement>,
  });

  protected readonly workTypeOptions = WORK_TYPES;

  public ngOnInit(): void {
    const selected = this.activatedRoute.snapshot.queryParamMap.get('selected');
    if (selected) this.boardViewService.openWorkItemDetailModal(selected);

    this.store
      .select(selectSpaceDetail)
      .pipe(
        switchMap((spaceDetails) => {
          this.boardViewState.setSpaceDetails(spaceDetails);
          return this.boardViewService.load(spaceDetails.id).pipe(catchError(() => EMPTY));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected openFilterModal(elementRef: HTMLElement): void {
    this.overlayService.open({
      template: this.filterModalTemplate(),
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(elementRef),
      positions: SpaceBoardsModalFilterPosition,
    });
  }

  protected onColumnDrop(e: CdkDragDrop<SpaceBoardColumn[]>): void {
    const next = [...this.boardViewState.snapshotColumns()];
    moveItemInArray(next, e.previousIndex, e.currentIndex);
    this.boardViewService.reorderColumns(next);
  }

  protected onCardDrop(e: CdkDragDrop<WorkItem[]>): void {
    // same-column → moveItemInArray; cross-column → transferArrayItem
    // then compute the new lexorank from neighbors and PATCH
  }

  protected setFilter<K extends keyof BoardFilterState>(facet: K, id: any, on: boolean): void {
    this.boardViewState.updateFilters((prev) => {
      const next = new Set(prev[facet]);
      on ? next.add(id) : next.delete(id);
      return { ...prev, [facet]: next };
    });
  }

  protected clearAllFilters(): void {
    this.boardViewState.clearAllFilters();
  }

  protected openColumnOptions(column: SpaceBoardColumn, trigger: HTMLElement, index: number): void {
    const optionLists = this.boardViewState.getColumnOptions(
      index,
      this.boardViewState.filteredColumns().length,
    );
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists,
          handleOptionEvent: (action: OptionConfigurations) =>
            this.boardViewService.handleColumnOption(action.id as string, column, trigger),
        },
      },
      connectedTo: new ElementRef(trigger),
      positions: SpaceBoardsModalFilterPosition,
    });
  }
}
