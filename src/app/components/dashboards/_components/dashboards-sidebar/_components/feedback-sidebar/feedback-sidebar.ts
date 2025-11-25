import { Component } from '@angular/core';
import { ModalService } from '../../../../../../services/modal-service/modal-service';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-feedback-sidebar',
  standalone: false,
  templateUrl: './feedback-sidebar.html',
  styleUrl: './feedback-sidebar.scss'
})
export class FeedbackSidebar {

  constructor(
    private modalService: ModalService,
    private formBuilder: FormBuilder
  ) { }
  public feedbackFormGroup!: FormGroup;
  public get feedbackTypeControl(): AbstractControl | null {
    return this.feedbackFormGroup.get('feedbackType');
  }
  public textAreaLabel: string | null = null;
  ngOnInit() {
    this.feedbackFormGroup = this.formBuilder.group({
      'feedbackType': this.formBuilder.control<'question' | 'comment' | 'bug' | 'improvement' | null>(null),
      'feedbackText': this.formBuilder.control<string | null>(null),
      'checkboxGroup': this.formBuilder.array([])
    });
  }
  public dismissModal() {
    this.modalService.closeDashboardModal();
  }
  public multiSelectConfig = {
    placeholder: 'Choose one',
    options: ['Ask a question', 'Leave a comment', 'Report a bug', 'Suggest an improvement'],
    isMultiSelect: false
  }
  public onSelect(selected: any) {
    let feedbackOptionIndex = this.multiSelectConfig.options.indexOf(selected);
    if (!selected || feedbackOptionIndex == -1) {
      this.feedbackTypeControl?.setValue(null);
      this.feedbackFormGroup.get('feedbackText')?.setValue(null);
      return;
    }
    switch (feedbackOptionIndex) {
      case 0:
        this.feedbackTypeControl?.setValue('question');
        this.textAreaLabel = "What would you like to know?"
        break;
      case 1:
        this.feedbackTypeControl?.setValue('comment');
        this.textAreaLabel = "Let us know what's on your mind"
        break;
      case 2:
        this.feedbackTypeControl?.setValue('bug');
        this.textAreaLabel = "Describe the bug or issue"
        break;
      case 3:
        this.feedbackTypeControl?.setValue('improvement');
        this.textAreaLabel = "Let us know what you'd like to improve"
        break;
    }
  }
}
