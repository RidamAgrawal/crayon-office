import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpaceTemplate, SpaceTemplatePickerComponent } from '../space-template-picker';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { HttpService } from '../../../../../../services/http-service/http-service';
import { TextField } from '../../../../../../templates/text-field/text-field';
import { spaceIconUrl1 } from '../../../dashboard-space/_components/dashboard-space-board-view/dashboard-space-board-view.constants';

@Component({
  selector: 'create-space-modal',
  templateUrl: './create-space-modal.component.html',
  styleUrl: './create-space-modal.component.scss',
  standalone: true,
  imports: [SpaceTemplatePickerComponent, ReactiveFormsModule, TextField],
})
export class CreateSpaceModalComponent {
  private readonly overlayService = inject(OverlayService);
  private readonly httpService = inject(HttpService);
  private readonly fb = inject(FormBuilder);

  protected readonly step = signal<1 | 2>(1);
  protected readonly selectedTemplate = signal<SpaceTemplate | null>(null);
  protected readonly isSubmitting = signal(false);

  protected readonly spaceForm = this.fb.group({
    name: ['', Validators.required],
    key: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,6}$/)]],
  });

  protected onTemplateSelected(template: SpaceTemplate): void {
    this.selectedTemplate.set(template);
    this.step.set(2);
  }

  protected onNameInput(): void {
    const name = this.spaceForm.get('name')?.value ?? '';
    // Auto-generate key from name: take first letters of each word, uppercase, max 4 chars
    const key = name
      .split(/\s+/)
      .filter(Boolean)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    this.spaceForm.get('key')?.setValue(key);
  }

  protected goBack(): void {
    this.step.set(1);
    this.selectedTemplate.set(null);
  }

  protected submit(): void {
    if (this.spaceForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const { name, key } = this.spaceForm.value;
    const icon = spaceIconUrl1 + (10400 + Math.floor(Math.random() * 25));

    this.httpService.createSpace(name!, key!, icon).subscribe({
      next: () => this.overlayService.close(),
      error: (err: unknown) => {
        console.error('Failed to create space:', err);
        this.isSubmitting.set(false);
      },
    });
  }

  protected close(): void {
    this.overlayService.close();
  }
}
