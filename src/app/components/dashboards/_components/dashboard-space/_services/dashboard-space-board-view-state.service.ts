import { computed, Injectable, Signal, signal } from '@angular/core';
import {
  BoardFilterOptions,
  BoardFilterState,
  SpaceBoardColumn,
  SpaceBoardDetails,
  SpaceDetails,
  WorkItem,
} from '../_models';
import {
  SpaceBoardsFilters,
  STATUS_OPTION_IDS,
  WORK_TYPES,
} from '../_components/dashboard-space-board-view/dashboard-space-board-view.constants';
import {
  OptionsList,
  OptionConfigurations,
} from '../../../../../templates/option-wrapper/option-wrapper.model';

@Injectable()
export class DashboardSpaceBoardViewStateService {
  private readonly _spaceDetails = signal<SpaceDetails | null>(null);
  private readonly _selectedModalTemplateFilter = signal<{
    id: string;
    text: string;
    isInfoIcon?: boolean;
  } | null>(null);
  //   private readonly _creatingInColumn = signal<string | null>(null);
  private readonly _modalTemplateFilters = SpaceBoardsFilters;
  private readonly _boardDetails = signal<SpaceBoardDetails | null>(null);
  private readonly _columns = signal<SpaceBoardColumn[]>([]);
  private readonly _isCreatingColumn = signal(false);
  private readonly _isColumnCreationInProgress = signal(false);
  private readonly _pendingColumnIds = signal<Set<string>>(new Set());
  private readonly _filters = signal<BoardFilterState>({
    assignee: new Set(),
    workType: new Set(),
    status: new Set(),
  });
  public readonly spaceId = computed(() => this._spaceDetails()?.id ?? '');
  public readonly allColumnIds = computed(() => this._columns().map((c: SpaceBoardColumn) => c.id));
  public readonly facetCounts = computed<Record<string, number>>(() => {
    const filters = this._filters();
    return {
      assignee: filters.assignee.size,
      workType: filters.workType.size,
      status: filters.status.size,
    };
  });
  public readonly totalFilterCount = computed(() =>
    Object.values(this.facetCounts()).reduce((a, b) => a + b, 0),
  );
  public readonly assigneeOptions = computed(() => {
    const members = this._spaceDetails()?.members ?? [];
    return [
      { id: null, label: 'Unassigned', avatar: null },
      ...members.map((m) => ({
        id: m.userId,
        label: m.user.displayName,
        avatar: m.user.avatarUrl,
      })),
    ];
  });
  public readonly statusOptions = computed(() =>
    this._columns().map((c: SpaceBoardColumn) => ({
      id: c.id,
      label: c.name,
      backgroundColor: c.backgroundColor,
    })),
  );
  public readonly filteredColumns = computed(() => {
    const { assignee, workType, status } = this._filters();
    return this._columns().map((col) => ({
      ...col,
      issues: col.issues.filter(
        (i: WorkItem) =>
          (assignee.size === 0 || assignee.has(i.assigneeId)) &&
          (workType.size === 0 || workType.has(i.workType)) &&
          (status.size === 0 || status.has(i.statusId)),
      ),
    }));
  });
  public readonly currentFacetTotals = computed(() => {
    const facet = this._selectedModalTemplateFilter()?.id;
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
  public readonly canCreateColumns: Signal<boolean> = computed(
    () =>
      this._spaceDetails()?.currentUser.role === 'ADMIN' ||
      this._spaceDetails()?.currentUser.role === 'OWNER',
  );

  public readonly spaceDetails = this._spaceDetails.asReadonly();
  public readonly selectedModalTemplateFilter = this._selectedModalTemplateFilter.asReadonly();
  //   public readonly creatingInColumn = this._creatingInColumn.asReadonly();
  public readonly modalTemplateFilters = this._modalTemplateFilters;
  public readonly boardDetails = this._boardDetails.asReadonly();
  public readonly pendingColumnIds = this._pendingColumnIds.asReadonly();
  public readonly filters = this._filters.asReadonly();
  public readonly isCreatingColumn = this._isCreatingColumn.asReadonly();
  public readonly isColumnCreationInProgress = this._isColumnCreationInProgress.asReadonly();

  public readonly workTypeOptions = WORK_TYPES;
  public setSpaceDetails(d: SpaceDetails | null): void {
    this._spaceDetails.set(d);
  }
  public setColumns(cols: SpaceBoardColumn[]): void {
    this._columns.set(cols);
  }
  public updateColumns(fn: (cols: SpaceBoardColumn[]) => SpaceBoardColumn[]): void {
    this._columns.update(fn);
  }
  public snapshotColumns(): SpaceBoardColumn[] {
    return this._columns();
  }
  public setPending(id: string, on: boolean): void {
    this._pendingColumnIds.update((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  }
  public selectModalTemplateFilters(filterOptions: BoardFilterOptions): void {
    this._selectedModalTemplateFilter.set(filterOptions);
  }
  public getColumnOptions(index: number, total: number): OptionsList[] {
    const can = this._spaceDetails()?.currentUser.can;

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
  public updateFilters(fn: (boardFilterState: BoardFilterState) => BoardFilterState): void {
    this._filters.update(fn);
  }
  public clearAllFilters(): void {
    this._filters.set({
      assignee: new Set(),
      workType: new Set(),
      status: new Set(),
    });
  }
  public setCreatingColumn(): void {
    this._isCreatingColumn.set(true);
  }
  public unsetCreatingColumn(): void {
    this._isCreatingColumn.set(false);
  }
  public setColumnCreationInProgress(): void {
    this._isColumnCreationInProgress.set(true);
  }
  public unsetColumnCreationInProgress(): void {
    this._isColumnCreationInProgress.set(false);
  }
  public setAllPending(on: boolean): void {
    this._pendingColumnIds.set(on ? new Set(this._columns().map((c) => c.id)) : new Set());
  }
}
