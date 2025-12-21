import { Component, EventEmitter, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

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
          { label: 'Ask a question', visible: true },
          { label: 'Leave a comment', visible: true },
          { label: 'Report a bug', visible: true },
          { label: 'Suggest an improvement', visible: true },
        ],
        heading: null,
      },
    ],
    isMultiSelect: false,
  };
  public onSelect(selected: any) {
    let feedbackOptionIndex =
      this.multiSelectConfig.optionLists[0].options.findIndex(
        (option: any) => option.label === selected
      );
    if (!selected || feedbackOptionIndex == -1) {
      this.feedbackTypeControl?.setValue(null);
      this.feedbackFormGroup.get('feedbackText')?.setValue(null);
      return;
    }
    switch (feedbackOptionIndex) {
      case 0:
        this.feedbackTypeControl?.setValue('question');
        this.textAreaLabel = 'What would you like to know?';
        break;
      case 1:
        this.feedbackTypeControl?.setValue('comment');
        this.textAreaLabel = "Let us know what's on your mind";
        break;
      case 2:
        this.feedbackTypeControl?.setValue('bug');
        this.textAreaLabel = 'Describe the bug or issue';
        break;
      case 3:
        this.feedbackTypeControl?.setValue('improvement');
        this.textAreaLabel = "Let us know what you'd like to improve";
        break;
    }
  }
  public prepareFeedback() {
    this.sendFeedback.emit(this.feedbackFormGroup.value);
  }
}
