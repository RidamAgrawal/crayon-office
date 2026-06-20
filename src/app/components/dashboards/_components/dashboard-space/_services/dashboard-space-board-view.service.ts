import { ElementRef, inject, Injectable } from '@angular/core';
import { forkJoin, tap, catchError, EMPTY, finalize, BehaviorSubject } from 'rxjs';
import { HttpService } from '../../../../../services/http-service/http-service';
import { DashboardSpaceBoardViewStateService } from './dashboard-space-board-view-state.service';
import { SpaceBoardColumn } from '../_models';
import {
  STATUS_OPTION_IDS,
  SpaceBoardsModalFilterPosition,
  pickNextPaletteColor,
} from '../_components/dashboard-space-board-view/dashboard-space-board-view.constants';
import { BoardColumnColorPickerComponent } from '../_templates';
import { BoardColumnDeleteModalTemplate } from '../_templates/board-column-delete-modal';
import { OverlayService } from '../../../../../services/overlay-service/overlay-service';
import { HttpErrorResponse } from '@angular/common/http';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { WorkItem } from '../../../_models';
import { WorkItemDetailComponent } from '../../work-item/_components/work-item-details';
import { ActivatedRoute, Router } from '@angular/router';

const group = (columns: SpaceBoardColumn[], issues: WorkItem[]) =>
  columns.map((c) => ({
    ...c,
    issues: issues.filter((i) => i.statusId === c.id).sort((a, b) => a.rank.localeCompare(b.rank)),
  }));

@Injectable()
export class DashboardSpaceBoardViewService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly httpService = inject(HttpService);
  private readonly overlayService = inject(OverlayService);
  private readonly boardViewState = inject(DashboardSpaceBoardViewStateService);

  public load(spaceId: string) {
    return forkJoin([
      this.httpService.getSpaceColumns(spaceId),
      this.httpService.getSpaceIssues(spaceId),
    ]).pipe(tap(([cols, issues]) => this.boardViewState.setColumns(group(cols, issues))));
  }

  public handleColumnOption(id: string, column: SpaceBoardColumn, trigger: HTMLElement): void {
    this.overlayService.close();
    switch (id) {
      case STATUS_OPTION_IDS.moveLeft:
        return this.moveColumn(column.id, -1);
      case STATUS_OPTION_IDS.moveRight:
        return this.moveColumn(column.id, +1);
      case STATUS_OPTION_IDS.setLimit:
        return; // TODO
      case STATUS_OPTION_IDS.setColor:
        return this.openColorPicker(column, trigger);
      case STATUS_OPTION_IDS.delete:
        return this.openDeleteColumnModal(column);
    }
  }

  public openColorPicker(column: SpaceBoardColumn, trigger: HTMLElement): void {
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

  public updateColumnColor(statusId: string, color: string): void {
    // Optimistic
    this.boardViewState.updateColumns((cols) =>
      cols.map((c) => (c.id === statusId ? { ...c, backgroundColor: color } : c)),
    );

    this.httpService
      .updateStatus(this.boardViewState.spaceId(), statusId, {
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

  public createColumn(statusName: string): void {
    const label = statusName.trim();
    if (!label) return;
    const name = label.toLocaleUpperCase().replace(/\s+/g, '_');
    const backgroundColor = pickNextPaletteColor(this.boardViewState.snapshotColumns()); // cycle through a fixed palette
    this.boardViewState.setColumnCreationInProgress();
    this.boardViewState.unsetCreatingColumn();
    this.httpService
      .createStatus(this.boardViewState.spaceId(), {
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
          this.boardViewState.unsetColumnCreationInProgress();
        }),
      )
      .subscribe((status) => {
        this.boardViewState.updateColumns((cols) => [...cols, { ...status, issues: [] }]);
      });
  }

  public openDeleteColumnModal(column: SpaceBoardColumn): void {
    const candidates = this.boardViewState.snapshotColumns().filter((c) => c.id !== column.id);

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

  public deleteColumn(column: SpaceBoardColumn, targetStatusId: string | null): void {
    const prev = this.boardViewState.snapshotColumns();

    // Optimistic: drop the column; move its issues into target if specified
    this.boardViewState.updateColumns((cols) => {
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
      .deleteStatus(this.boardViewState.spaceId(), column.id, targetStatusId ?? undefined)
      .pipe(
        catchError(() => {
          this.boardViewState.setColumns(prev);
          return EMPTY;
        }),
        finalize(() => {
          if (targetStatusId) this.setPending(targetStatusId, false);
          this.overlayService.close();
        }),
      )
      .subscribe((res) => {
        this.boardViewState.updateFilters((f) => {
          const next = new Set(f.status);
          next.delete(column.id);
          return { ...f, status: next };
        });
      });
  }

  public setPending(id: string, on: boolean): void {
    this.boardViewState.setPending(id, on);
  }

  public onColumnRenamed(e: { columnId: string; label: string }): void {
    const name = e.label.toLocaleUpperCase().replace(/\s+/g, '_');
    const prev = this.boardViewState.snapshotColumns();

    this.boardViewState.updateColumns((cols) =>
      cols.map((c) => (c.id === e.columnId ? { ...c, name, label: e.label } : c)),
    );

    this.httpService
      .updateStatus(this.boardViewState.spaceId(), e.columnId, {
        name,
        label: e.label,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.boardViewState.setColumns(prev);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  public onIssueCreate(e: {
    statusId: string;
    summary: string;
    workType: string;
    dueDate: string | null;
  }): void {
    const tempId = `temp-${Date.now()}`;
    const prev = this.boardViewState.snapshotColumns();

    this.boardViewState.updateColumns((cols) =>
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
      .createIssue(this.boardViewState.spaceId(), e)
      .pipe(
        catchError(() => {
          this.boardViewState.setColumns(prev); // rollback
          return EMPTY;
        }),
      )
      .subscribe((issue) => {
        this.boardViewState.updateColumns((cols) =>
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

  private moveColumn(columnId: string, direction: -1 | 1): void {
    const cols = this.boardViewState.snapshotColumns();
    const from = cols.findIndex((c) => c.id === columnId);
    const to = from + direction;
    if (from === -1 || to < 0 || to >= cols.length) return;

    const reordered = [...cols];
    moveItemInArray(reordered, from, to);
    this.reorderColumns(reordered);
  }

  public reorderColumns(reordered: SpaceBoardColumn[]): void {
    const prev = this.boardViewState.snapshotColumns();
    this.boardViewState.setColumns(reordered);
    this.boardViewState.setAllPending(true);

    this.httpService
      .reorderStatuses(
        this.boardViewState.spaceId(),
        reordered.map((c) => c.id),
      )
      .pipe(
        catchError(() => {
          this.boardViewState.setColumns(prev); // rollback
          return EMPTY;
        }),
        finalize(() => this.boardViewState.setAllPending(false)),
      )
      .subscribe();
  }

  public openWorkItemDetailModal(issueKey: string): void {
    const overlayRef = this.overlayService.open({
      component: WorkItemDetailComponent,
      componentInputs: { issueKey },
      componentOutputs: {
        updated: (issue: WorkItem) => {
          this.boardViewState.updateColumns(cols =>
            cols.map((c) => ({
              ...c,
              issues: c.issues.map((i) => (i.id === issue.id ? issue : i)),
            })),
          )
        },
      },
      hasBackdrop: true,
      closeOnBackdropClick: true,
    });
    overlayRef.detachments().subscribe(() => this.clearSelected());
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { selected: issueKey },
      queryParamsHandling: 'merge',
    });
  }

  private clearSelected(): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { selected: null },
      queryParamsHandling: 'merge',
    });
  }
}
