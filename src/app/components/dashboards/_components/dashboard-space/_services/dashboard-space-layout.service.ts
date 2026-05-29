import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class DashboardSpaceLayoutService {
    public readonly isExpanded = signal(false);
    public toggle() { this.isExpanded.update(v => !v); }
}