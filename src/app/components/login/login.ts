import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OverlayService } from '../../services/overlay-service/overlay-service';
import { LoginModal } from './_components/modal/login-modal';
import { SignupModal } from './_components/signup-modal/signup-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private readonly overlayService = inject(OverlayService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    const mode = this.route.snapshot.data[0];
    const component = mode === 'login' ? LoginModal : SignupModal;

    this.overlayService.open({
      component,
      hasBackdrop: true,
      backdropClass: 'login-backdrop',
      config: {
        scrollStrategy: undefined,
      },
    });
  }
}