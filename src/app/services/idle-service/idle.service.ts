import { DestroyRef, inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subject, fromEvent, merge, timer, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_DEBOUNCE_MS = 2000;
const STORAGE_KEY = 'last_active_at';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly idleSubject = new Subject<void>();
  private subscription: Subscription | null = null;
  private _isIdle = false;

  public readonly idle$: Observable<void> = this.idleSubject.asObservable();

  public get isIdle(): boolean {
    return this._isIdle;
  }

  public start(): void {
    if (this.subscription) return;

    this.touchActivity();

    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart'),
      ).pipe(debounceTime(ACTIVITY_DEBOUNCE_MS));

      this.subscription = activity$
        .pipe(
          switchMap(() => {
            this.touchActivity();
            return timer(IDLE_TIMEOUT_MS);
          }),
        )
        .subscribe(() => {
          this._isIdle = true;
          this.zone.run(() => this.idleSubject.next());
        });

      // Also kick off the initial timer (no activity needed to start counting)
      this.subscription.add(
        timer(IDLE_TIMEOUT_MS).subscribe(() => {
          if (!this._isIdle) {
            this._isIdle = true;
            this.zone.run(() => this.idleSubject.next());
          }
        }),
      );
    });

    this.destroyRef.onDestroy(() => this.stop());
  }

  public reset(): void {
    this._isIdle = false;
    this.touchActivity();
    this.stop();
    this.start();
  }

  public stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private touchActivity(): void {
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
  }
}
