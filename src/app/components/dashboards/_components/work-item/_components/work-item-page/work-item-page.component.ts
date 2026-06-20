import { Component, inject } from '@angular/core';
import { WorkItemDetailComponent } from '../work-item-details';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'work-item-page-component',
  templateUrl: './work-item-page.component.html',
  styleUrl: './work-item-page.component.scss',
  imports: [WorkItemDetailComponent],
})
export class WorkItemPageComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  protected issueKey = toSignal(
    this.activatedRoute.paramMap.pipe(map((p) => p.get('issueKey') ?? null)),
    {
      initialValue: null,
    },
  );

  public ngOnInit(): void {}
}
