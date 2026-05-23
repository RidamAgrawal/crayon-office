import { Component, inject } from '@angular/core';
import { DashboardSpaceHeader } from './_components/dashboard-space-header/dashboard-space-header.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { SpaceDetails } from './_models';
import { setSpaceDetails } from './_store/dashboard-space-store.actions';

@Component({
  selector: 'dashboard-space',
  templateUrl: './dashboard-space.component.html',
  styleUrl: './dashboard-space.component.scss',
  imports: [DashboardSpaceHeader, RouterOutlet],
})
export class DashboardSpace {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly store = inject(Store);

  public ngOnInit(): void {
    this.activatedRoute.data.subscribe((data) => {
      this.store.dispatch(
        setSpaceDetails(data as { spaceDetails: SpaceDetails }),
      );
    });
  }
}
