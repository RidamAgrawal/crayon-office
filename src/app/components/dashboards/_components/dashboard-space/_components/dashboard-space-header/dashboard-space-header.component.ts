import {
  Component,
  inject,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSpaceDetail } from '../../_store/dashboard-space-store.selector';
import { DashboardSpaceHeaderService } from '../../_services';
import { OptionsList } from '../../../../../../templates/option-wrapper/option-wrapper.model';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { MultiSelect } from '../../../../../../templates/multi-select/multi-select';
import { TextField } from '../../../../../../templates/text-field/text-field';

@Component({
  selector: 'dashboard-space-header',
  templateUrl: './dashboard-space-header.component.html',
  styleUrl: './dashboard-space-header.component.scss',
  imports: [RouterLink, RouterLinkActive, MultiSelect, TextField],
})
export class DashboardSpaceHeader {
  private readonly store = inject(Store);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overlayService = inject(OverlayService);
  private readonly dashboardSpaceHeaderService = inject(
    DashboardSpaceHeaderService,
  );

  protected readonly addPeopleTemplate = viewChild('addPeopleTemplate', {
    read: TemplateRef<HTMLElement>,
  });

  protected readonly spaceDetail = toSignal(
    this.store.select(selectSpaceDetail),
  );

  protected onOptionsClick(event: MouseEvent): void {
    if (!event.target) return;
    this.dashboardSpaceHeaderService.handleMoreOptionsClick(
      event.target as HTMLButtonElement,
      structuredClone(this.spaceDetail()!.optionLists),
    );
  }

  protected onNavOptionsClick(
    event: MouseEvent,
    optionsList: OptionsList[],
  ): void {
    if (!event.target) return;
    this.dashboardSpaceHeaderService.handleMoreOptionsClick(
      event.target as HTMLButtonElement,
      optionsList,
    );
  }

  private openAddPeopleModal() {
    this.overlayService.open({
      template: this.addPeopleTemplate(),
      viewContainerRef: this.viewContainerRef,
      closeOnBackdropClick: true,
      hasBackdrop: true,
    });
  }
}
