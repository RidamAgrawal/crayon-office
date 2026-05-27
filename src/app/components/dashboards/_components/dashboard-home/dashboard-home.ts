import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { TabComponent } from '../tabs/tabs';
import { TabularTemplate1 } from '../../../../templates/tabular-template-1/tabular-template-1';
import { TabTemplate2 } from '../../../../templates/tab-template-2/tab-template-2';
import { HttpService } from '../../../../services/http-service/http-service';
import { AuthenticationService } from '../../../../services/authentication/authentication.service';
import { Store } from '@ngrx/store';
import { setUserDetails } from '../../store/dashboards-store.actions';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  imports: [TabComponent, TabularTemplate1, TabTemplate2, RouterLink],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss',
})
export class DashboardHome implements OnInit {
  private readonly store = inject(Store);
  private readonly httpService = inject(HttpService);
  private readonly authService = inject(AuthenticationService);
  protected readonly spaces: WritableSignal<any[]> = signal<any>([]);

  public ngOnInit(): void {
    const userDetail = this.authService.currentUser;
    if (userDetail) this.store.dispatch(setUserDetails({ userDetail }));
    this.httpService.getSpaces().subscribe((response) => {
      this.spaces.set(response);
    });
  }

  public fetchUserApps(): void {
    
  }
}
