import {
  Component,
  inject,
  viewChild,
  ViewContainerRef,
  TemplateRef,
  signal,
  ElementRef,
  computed,
  WritableSignal,
  Signal,
} from '@angular/core';
import { TextField } from '../../../../../../templates/text-field/text-field';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { HttpService } from '../../../../../../services/http-service/http-service';
import {
  pickNextPaletteColor,
  SpaceBoardsFilters,
  SpaceBoardsModalFilterPosition,
  STATUS_OPTION_IDS,
  WORK_TYPES,
} from './dashboard-space-board-view.constants';
import { Checkbox } from '../../../../../../templates/checkbox/checkbox';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import {
  BoardFilterState,
  SpaceBoardColumn,
  SpaceBoardDetails,
  SpaceDetails,
  WorkItem,
} from '../../_models';
import {
  selectSpaceBoardDetails,
  selectSpaceDetail,
} from '../../_store/dashboard-space-store.selector';
import { catchError, EMPTY, finalize, forkJoin, switchMap } from 'rxjs';
import { BoardViewColumnTemplate } from '../../_templates/board-column-template';
import { FormsModule } from '@angular/forms';
import { NamePipe } from '../../../../../../pipes/name-pipe/name-pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { ClickOutside } from '../../../../../../directives';
import {
  OptionConfigurations,
  OptionsList,
} from '../../../../../../templates/option-wrapper/option-wrapper.model';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { BoardColumnColorPickerComponent } from '../../_templates';
import { BoardSpaceTextFieldWrapperTemplate } from '../../_templates/board-space-text-field-wrapper-template';
import { BoardColumnDeleteModalTemplate } from '../../_templates/board-column-delete-modal';

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
})
export class DashboardSpaceBoardViewComponent {
  private readonly store = inject(Store);
  private readonly httpService = inject(HttpService);
  private readonly overlayService = inject(OverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private filterModalTemplate = viewChild('filterModalTemplate', {
    read: TemplateRef<HTMLElement>,
  });

  private readonly spaceDetails = signal<SpaceDetails | null>(null);
  protected readonly selectedModalTemplateFilter = signal<{
    id: string;
    text: string;
    isInfoIcon?: boolean;
  } | null>(null);
  protected readonly creatingInColumn = signal<string | null>(null);

  protected readonly modalTemplatefilters = SpaceBoardsFilters;

  protected readonly boardDetails = signal<SpaceBoardDetails | null>(null);
  protected readonly columns = signal<SpaceBoardColumn[]>([]);
  protected readonly allColumnIds = computed(() =>
    (this.columns() ?? []).map((c: SpaceBoardColumn) => c.id),
  );

  protected readonly filters = signal<BoardFilterState>({
    assignee: new Set(),
    workType: new Set(),
    status: new Set(),
  });

  protected readonly facetCounts = computed<Record<string, number>>(() => {
    const f = this.filters();
    return {
      assignee: f.assignee.size,
      workType: f.workType.size,
      status: f.status.size,
    };
  });

  protected readonly totalFilterCount = computed(() =>
    Object.values(this.facetCounts()).reduce((a, b) => a + b, 0),
  );

  protected readonly assigneeOptions = computed(() => {
    const members = this.spaceDetails()?.members ?? [];
    return [
      { id: null, label: 'Unassigned', avatar: null },
      ...members.map((m) => ({
        id: m.userId,
        label: m.user.displayName,
        avatar: m.user.avatarUrl,
      })),
    ];
  });

  protected readonly workTypeOptions = WORK_TYPES;
  protected readonly statusOptions = computed(() =>
    (this.columns() ?? []).map((c: SpaceBoardColumn) => ({
      id: c.id,
      label: c.name,
      backgroundColor: c.backgroundColor,
    })),
  );

  protected readonly filteredColumns = computed(() => {
    const { assignee, workType, status } = this.filters();
    return (this.columns() ?? []).map((col) => ({
      ...col,
      issues: col.issues.filter(
        (i: WorkItem) =>
          (assignee.size === 0 || assignee.has(i.assigneeId)) &&
          (workType.size === 0 || workType.has(i.workType)) &&
          (status.size === 0 || status.has(i.statusId)),
      ),
    }));
  });

  protected readonly currentFacetTotals = computed(() => {
    const facet = this.selectedModalTemplateFilter()?.id;
    switch (facet) {
      case 'assignee':
        return {
          shown: this.assigneeOptions().length,
          total: this.assigneeOptions().length,
        };
      case 'workType':
        return {
          shown: this.workTypeOptions.length,
          total: this.workTypeOptions.length,
        };
      case 'status':
        return {
          shown: this.statusOptions().length,
          total: this.statusOptions().length,
        };
      default:
        return { shown: 0, total: 0 };
    }
  });

  protected readonly canCreateColumns: Signal<boolean> = computed(
    () =>
      this.spaceDetails()?.currentUser.role === 'ADMIN' ||
      this.spaceDetails()?.currentUser.role === 'OWNER',
  );
  protected readonly isCreatingColumn: WritableSignal<boolean> = signal(false);
  protected readonly isColumnCreationInProgress: WritableSignal<boolean> = signal(false);

  protected readonly pendingColumnIds: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

  protected getColumnOptions(
    column: SpaceBoardColumn,
    index: number,
    total: number,
  ): OptionsList[] {
    const can = this.spaceDetails()?.currentUser.can;

    const opts: OptionConfigurations[] = [];
    if (index > 0)
      opts.push({
        type: 'button',
        id: STATUS_OPTION_IDS.moveLeft,
        label: 'Move column left',
        visible: true,
      });
    if (index < total - 1)
      opts.push({
        type: 'button',
        id: STATUS_OPTION_IDS.moveRight,
        label: 'Move column right',
        visible: true,
      });
    opts.push({
      type: 'button',
      id: STATUS_OPTION_IDS.setLimit,
      label: 'Set column limit',
      visible: true,
    });
    opts.push({
      type: 'button',
      id: STATUS_OPTION_IDS.setColor,
      label: 'Set column color',
      visible: true,
    });

    const danger: OptionConfigurations[] =
      total > 1 && can?.manageStatuses
        ? [
            {
              type: 'button',
              id: STATUS_OPTION_IDS.delete,
              label: 'Delete',
              visible: true,
            },
          ]
        : [];

    return [{ options: opts }, { options: danger }];
  }

  public ngOnInit(): void {
    this.store
      .select(selectSpaceDetail)
      .pipe(
        switchMap((spaceDetails) => {
          this.spaceDetails.set(spaceDetails);

          return forkJoin([
            this.httpService.getSpaceColumns(spaceDetails.id),
            this.httpService.getSpaceIssues(spaceDetails.id),
          ]);
        }),
        catchError(() => EMPTY),
      )
      .subscribe(([columns, issues]: [SpaceBoardColumn[], WorkItem[]]) => {
        const grouped = columns.map((c) => ({
          ...c,
          issues: issues
            .filter((i) => i.statusId === c.id)
            .sort((a, b) => a.rank.localeCompare(b.rank)),
        }));
        this.columns.set(grouped);
      });
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
    const next = [...this.columns()!];
    moveItemInArray(next, e.previousIndex, e.currentIndex);
    this.columns.set(next);
    // this.httpService.reorderStatuses(spaceId, next.map(c => c.id)).subscribe({
    //     error: () => this.columns.set(/* old snapshot */),
    // });
  }

  protected onCardDrop(e: CdkDragDrop<WorkItem[]>): void {
    // same-column → moveItemInArray; cross-column → transferArrayItem
    // then compute the new lexorank from neighbors and PATCH
  }

  protected toggleFilter<K extends keyof BoardFilterState>(facet: K, id: any): void {
    this.filters.update((prev) => {
      const next = new Set(prev[facet]);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [facet]: next };
    });
  }

  protected setFilter<K extends keyof BoardFilterState>(facet: K, id: any, on: boolean): void {
    this.filters.update((prev) => {
      const next = new Set(prev[facet]);
      on ? next.add(id) : next.delete(id);
      return { ...prev, [facet]: next };
    });
  }

  protected clearAllFilters(): void {
    this.filters.set({
      assignee: new Set(),
      workType: new Set(),
      status: new Set(),
    });
  }

  protected clearFacet<K extends keyof BoardFilterState>(facet: K): void {
    this.filters.update((prev) => ({ ...prev, [facet]: new Set() }));
  }

  protected createColumn(statusName: string): void {
    const label = statusName.trim();
    if (!label) return;
    const name = label.toLocaleUpperCase().replace(/\s+/g, '_');
    const backgroundColor = pickNextPaletteColor(this.columns()); // cycle through a fixed palette
    this.isColumnCreationInProgress.set(true);
    this.isCreatingColumn.set(false);
    this.httpService
      .createStatus(this.spaceDetails()!.id, {
        name,
        label,
        backgroundColor,
        category: 'TODO',
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.log(err);
          return EMPTY;
        }),
        finalize(() => {
          this.isColumnCreationInProgress.set(false);
        }),
      )
      .subscribe((status) => {
        this.columns.update((cols) => [...cols, { ...status, issues: [] }]);
      });
  }

  protected openColumnOptions(column: SpaceBoardColumn, trigger: HTMLElement, index: number): void {
    const optionLists = this.getColumnOptions(column, index, this.filteredColumns().length);
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists,
          handleOptionEvent: (action: OptionConfigurations) =>
            this.handleColumnOption(action.id as string, column, trigger),
        },
      },
      connectedTo: new ElementRef(trigger),
      positions: SpaceBoardsModalFilterPosition,
    });
  }

  private handleColumnOption(id: string, column: SpaceBoardColumn, trigger: HTMLElement): void {
    switch (id) {
      // case STATUS_OPTION_IDS.moveLeft: return this.moveColumn(column.id, -1);
      // case STATUS_OPTION_IDS.moveRight: return this.moveColumn(column.id, +1);
      case STATUS_OPTION_IDS.setLimit:
        return; // TODO
      case STATUS_OPTION_IDS.setColor:
        return this.openColorPicker(column, trigger);
      case STATUS_OPTION_IDS.delete:
        return this.openDeleteColumnModal(column);
    }
  }

  private openColorPicker(column: SpaceBoardColumn, trigger: HTMLElement): void {
    this.overlayService.open({
      component: BoardColumnColorPickerComponent,
      componentInputs: { current: column.backgroundColor },
      componentOutputs: {
        pick: (color: string) => {
          this.updateColumnColor(column.id, color);
          this.overlayService.close();
        },
        close: () => {
          this.overlayService.close();
        },
      },
      connectedTo: new ElementRef(trigger),
      positions: SpaceBoardsModalFilterPosition,
    });
  }

  private updateColumnColor(statusId: string, color: string): void {
    // Optimistic
    this.columns.update((cols) =>
      cols.map((c) => (c.id === statusId ? { ...c, backgroundColor: color } : c)),
    );

    this.httpService
      .updateStatus(this.spaceDetails()!.id, statusId, {
        backgroundColor: color,
      })
      .pipe(
        catchError(() => {
          // Revert — keep a snapshot before the optimistic update if you want strict rollback
          return EMPTY;
        }),
      )
      .subscribe();
  }

  protected onColumnRenamed(e: { columnId: string; label: string }): void {
    const name = e.label.toLocaleUpperCase().replace(/\s+/g, '_');
    const prev = this.columns();

    // Optimistic — immutable update so signals fire
    this.columns.update((cols) =>
      cols.map((c) => (c.id === e.columnId ? { ...c, name, label: e.label } : c)),
    );

    this.httpService
      .updateStatus(this.spaceDetails()!.id, e.columnId, {
        name,
        label: e.label,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.columns.set(prev); // rollback
          return EMPTY;
        }),
      )
      .subscribe();
  }

  protected onIssueCreate(e: {
    statusId: string;
    summary: string;
    workType: string;
    dueDate: string | null;
  }): void {
    const tempId = `temp-${Date.now()}`;
    const prev = this.columns();

    // Optimistic insert
    this.columns.update((cols) =>
      cols.map((c) =>
        c.id === e.statusId
          ? {
              ...c,
              issues: [
                ...c.issues,
                {
                  id: tempId,
                  summary: e.summary,
                  statusId: e.statusId,
                  workType: e.workType,
                  rank: String(Date.now()),
                  key: '' /* fill defaults */,
                } as WorkItem,
              ],
            }
          : c,
      ),
    );

    this.httpService
      .createIssue(this.spaceDetails()!.id, e)
      .pipe(
        catchError(() => {
          this.columns.set(prev); // rollback
          return EMPTY;
        }),
      )
      .subscribe((issue) => {
        // Replace temp row with the server's authoritative copy (has real id, key, etc.)
        this.columns.update((cols) =>
          cols.map((c) =>
            c.id === e.statusId
              ? {
                  ...c,
                  issues: c.issues.map((i) => (i.id === tempId ? issue : i)),
                }
              : c,
          ),
        );
      });
  }

  private openDeleteColumnModal(column: SpaceBoardColumn): void {
    const candidates = this.columns().filter((c) => c.id !== column.id);

    this.overlayService.open({
      component: BoardColumnDeleteModalTemplate,
      componentInputs: { source: column, candidates },
      componentOutputs: {
        confirm: (targetStatusId: string | null) => {
          this.deleteColumn(column, targetStatusId);
        },
        cancel: () => this.overlayService.close(),
      },
      hasBackdrop: true,
      closeOnBackdropClick: true,
      // centered positioning — match the work-item modal's overlay config
    });
  }

  private deleteColumn(column: SpaceBoardColumn, targetStatusId: string | null): void {
    const prev = this.columns();

    // Optimistic: drop the column; move its issues into target if specified
    this.columns.update((cols) => {
      const moved = targetStatusId
        ? cols.map((c) =>
            c.id === targetStatusId
              ? {
                  ...c,
                  issues: [
                    ...c.issues,
                    ...column.issues.map((i) => ({
                      ...i,
                      statusId: targetStatusId,
                    })),
                  ],
                }
              : c,
          )
        : cols;
      return moved.filter((c) => c.id !== column.id);
    });

    if (targetStatusId) this.setPending(targetStatusId, true);

    this.httpService
      .deleteStatus(this.spaceDetails()!.id, column.id, targetStatusId ?? undefined)
      .pipe(
        catchError(() => {
          this.columns.set(prev);
          return EMPTY;
        }),
        finalize(() => {
          if (targetStatusId) this.setPending(targetStatusId, false);
          this.overlayService.close();
        }),
      )
      .subscribe((res) => {
        this.filters.update((f) => {
          const next = new Set(f.status);
          next.delete(column.id);
          return { ...f, status: next };
        });
      });
  }

  private setPending(id: string, on: boolean): void {
    this.pendingColumnIds.update((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  }
}
