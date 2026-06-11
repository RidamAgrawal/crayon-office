import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpService } from '../../../../../services/http-service/http-service';

export const DashboardSpaceResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const httpService = inject(HttpService);
  const spaceId = route.paramMap.get('spaceId')!;
  return httpService.getSpaceHeaderDataAndSummary(spaceId);
};
