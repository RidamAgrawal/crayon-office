import {
  Component,
  inject,
  viewChild,
  ViewContainerRef,
  TemplateRef,
  signal,
  ElementRef,
  computed,
} from '@angular/core';
import { TextField } from '../../../../../../templates/text-field/text-field';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { HttpService } from '../../../../../../services/http-service/http-service';
import {
  SpaceBoardsFilters,
  SpaceBoardsModalFilterPosition,
  WORK_TYPES,
} from './dashboard-space-board-view.constants';
import { Checkbox } from '../../../../../../templates/checkbox/checkbox';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
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
import { catchError, EMPTY, forkJoin, switchMap } from 'rxjs';
import { BoardViewColumnTemplate } from '../../_templates/board-column-template';

@Component({
  selector: 'dashboard-space-board-view',
  templateUrl: './dashboard-space-board-view.component.html',
  styleUrl: './dashboard-space-board-view.component.scss',
  imports: [TextField, Checkbox, BoardViewColumnTemplate, DragDropModule],
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

  protected readonly assigneeOptions = computed(() => {
    const members = this.spaceDetails()?.members ?? [];
    return [
      { id: null, label: 'Unassigned', avatar: null },
      ...members.map(m => ({ id: m.userId, label: m.user.displayName, avatar: m.user.avatarUrl })),
    ];
  });

  protected readonly workTypeOptions = WORK_TYPES;
  protected readonly statusOptions = computed(() =>
    (this.columns() ?? []).map((c: SpaceBoardColumn) => ({ id: c.id, label: c.name }))
  );

  protected readonly filteredColumns = computed(() => {
    const { assignee, workType, status } = this.filters();
    return (this.columns() ?? []).map(col => ({
      ...col,
      issues: col.issues.filter((i: WorkItem) =>
        (assignee.size === 0 || assignee.has(i.assigneeId)) &&
        (workType.size === 0 || workType.has(i.workType)) &&
        (status.size === 0 || status.has(i.statusId))
      ),
    }));
  });


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
    this.filters.update(prev => {
      const next = new Set(prev[facet]);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [facet]: next };
    });
  }

}
