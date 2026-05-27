import {
  Component,
  computed,
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
import { PER_TAB_OPTIONS, SPACE_MENU, toOption, VIEW_TYPE_UI } from '../../dashboard-space.constants';
import { SpaceNav } from '../../_models';

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

  protected readonly optionLists = computed<OptionsList[]>(() => {
    const can = this.spaceDetail()?.currentUser.can;
    if (!can) return [];
    const visible = SPACE_MENU.filter(item => !item.requires || can[item.requires]);
    // Group "delete" in its own list to get the divider you have in the mock
    return [
      { options: visible.filter(i => i.id !== 'deleteSpace').map(toOption) },
      { options: visible.filter(i => i.id === 'deleteSpace').map(toOption) },
    ];
  });

  protected readonly spaceNavs = computed<SpaceNav[]>(() =>
    (this.spaceDetail()?.views ?? []).map(v => ({
      id: v.id,
      label: v.name,
      icon: VIEW_TYPE_UI[v.type].icon,
      routerLink: VIEW_TYPE_UI[v.type].routerLink,
      optionLists: PER_TAB_OPTIONS, // static — rename, move-left/right, etc.
    })),
  );


  protected onOptionsClick(event: MouseEvent): void {
    if (!event.target) return;
    this.dashboardSpaceHeaderService.handleMoreOptionsClick(
      event.target as HTMLButtonElement,
      structuredClone(this.optionLists()),
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
