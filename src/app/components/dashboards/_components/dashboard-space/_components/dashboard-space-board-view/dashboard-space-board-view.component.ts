import { Component, inject, viewChild, ViewContainerRef, TemplateRef, signal, ElementRef } from '@angular/core';
import { TextField } from "../../../../../../templates/text-field/text-field";
import { OverlayService } from "../../../../../../services/overlay-service/overlay-service";
import { HttpService } from '../../../../../../services/http-service/http-service';
import { SpaceBoardsFilters, SpaceBoardsModalFilterPosition } from './dashboard-space-board-view.constants';
import { Checkbox } from '../../../../../../templates/checkbox/checkbox';

@Component({
    selector: 'dashboard-space-board-view',
    templateUrl: './dashboard-space-board-view.component.html',
    styleUrl: './dashboard-space-board-view.component.scss',
    imports: [TextField, Checkbox]
})
export class DashboardSpaceBoardViewComponent {
    private readonly httpService = inject(HttpService);
    private readonly overlayService = inject(OverlayService);
    private readonly viewContainerRef = inject(ViewContainerRef);

    private filterModalTemplate = viewChild('filterModalTemplate', { read: TemplateRef<HTMLElement> });

    protected readonly selectedModalTemplateFilter = signal<{ id: string; text: string; isInfoIcon?: boolean } | null>(null);

    protected readonly modalTemplatefilters = SpaceBoardsFilters;

    protected openFilterModal(elementRef: HTMLElement): void {
        this.overlayService.open({
            template: this.filterModalTemplate(),
            viewContainerRef: this.viewContainerRef,
            connectedTo: new ElementRef(elementRef),
            positions: SpaceBoardsModalFilterPosition
        })
    }
}