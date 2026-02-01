import { Component, EventEmitter, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { OptionConfigurations } from '../../../../../../templates/option-wrapper/option-wrapper.model';

@Component({
  selector: 'app-feedback-sidebar',
  standalone: false,
  templateUrl: './feedback-sidebar.html',
  styleUrl: './feedback-sidebar.scss',
})
export class FeedbackSidebar {
  constructor(private formBuilder: FormBuilder) {}
  public feedbackFormGroup!: FormGroup;
  public get feedbackTypeControl(): AbstractControl | null {
    return this.feedbackFormGroup.get('feedbackType');
  }
  public textAreaLabel: string | null = null;
  @Output() sendFeedback: EventEmitter<any> = new EventEmitter<any>();
  public ngOnInit() {
    this.feedbackFormGroup = this.formBuilder.group({
      feedbackType: this.formBuilder.control<
        'question' | 'comment' | 'bug' | 'improvement' | null
      >(null, [Validators.required]),
      feedbackText: this.formBuilder.control<string | null>(null, [
        Validators.required,
        Validators.minLength(4),
      ]),
      checkboxGroup: this.formBuilder.group({
        checkbox1: this.formBuilder.control<boolean>(false),
        checkbox2: this.formBuilder.control<boolean>(false),
      }),
    });
  }
  public dismissModal() {
    this.sendFeedback.emit(null);
  }
  public multiSelectConfig = {
    placeholder: 'Choose one',
    optionLists: [
      {
        options: [
          { id: 'question', label: 'Ask a question', visible: true },
          { id: 'comment', label: 'Leave a comment', visible: true },
          { id: 'bug', label: 'Report a bug', visible: true },
          { id: 'improvement', label: 'Suggest an improvement', visible: true },
        ],
        heading: null,
      },
    ],
    isMultiSelect: false,
  };
  public onSelect(selectedOptions: OptionConfigurations[]) {
    let selected = selectedOptions[0];
    if (!selected) {
      this.feedbackTypeControl?.setValue(null);
      this.feedbackFormGroup.get('feedbackText')?.setValue(null);
      return;
    }
    switch (selected.id) {
      case 'question':
        this.feedbackTypeControl?.setValue('question');
        this.textAreaLabel = 'What would you like to know?';
        break;
      case 'comment':
        this.feedbackTypeControl?.setValue('comment');
        this.textAreaLabel = "Let us know what's on your mind";
        break;
      case 'bug':
        this.feedbackTypeControl?.setValue('bug');
        this.textAreaLabel = 'Describe the bug or issue';
        break;
      case 'improvement':
        this.feedbackTypeControl?.setValue('improvement');
        this.textAreaLabel = "Let us know what you'd like to improve";
        break;
    }
  }
  public prepareFeedback() {
    this.sendFeedback.emit(this.feedbackFormGroup.value);
  }
}
