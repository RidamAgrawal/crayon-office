import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  Component,
  WritableSignal,
  viewChild,
  signal,
  inject,
  computed,
  Signal,
} from '@angular/core';
import { TextField } from '../../../text-field/text-field';
import { UnicodeToEmojiPipe } from '../../pipes/unicode-emoji-pipe';
import { HttpService } from '../../../../services/http-service/http-service';
import { EmojiStructure, RaisedHandEmoji, EmojiRow } from '../../wysiwyg2.models';
import { EditorCommandsService } from '../../services';

@Component({
  selector: 'app-emoji-picker',
  imports: [
    CommonModule,
    CdkVirtualScrollViewport,
    ScrollingModule,
    TextField,
    UnicodeToEmojiPipe,
  ],
  templateUrl: './emoji-picker.html',
  styleUrl: './emoji-picker.scss',
})
export class EmojiPicker {
  private readonly httpService = inject(HttpService);
  private readonly editorCommandService = inject(EditorCommandsService);
  private readonly viewportRef = viewChild(CdkVirtualScrollViewport, {
    read: CdkVirtualScrollViewport,
  });
  protected emojiContent: WritableSignal<Record<string, EmojiStructure[]>> = signal({});
  protected raisedHandEmoji: EmojiStructure = RaisedHandEmoji;
  protected isEmojiTonePickerOpen = signal(false);
  protected lastPickedEmoji: WritableSignal<EmojiStructure | null> = signal(null);
  protected currentEmojiTone: WritableSignal<string> = signal('');
  protected emojiRows: Signal<EmojiRow[]> = computed(() => {
    const rows: EmojiRow[] = [];
    const headingIndices: Map<string, number> = new Map();
    let rowIndex = 0;
    let searchString = this.searchEmoji().toLowerCase();
    for (let category of Object.entries(this.emojiContent())) {
      const filteredEmojis = category[1].filter((emoji: EmojiStructure) => emoji.name.toLowerCase().includes(searchString));
      if (filteredEmojis.length == 0) continue;
      headingIndices.set(category[0], rowIndex);
      rows.push({ type: 'heading', name: category[0] });
      rowIndex++;
      for (let i = 0; i < filteredEmojis.length; i += 7) {
        const rowEmojis = filteredEmojis.slice(i, i + 7);
        rows.push({ type: 'emojis', emojis: rowEmojis });
        rowIndex++;
      }
    }
    this.categoryHeadingIndices = headingIndices;
    return rows;
  });
  protected selectedCategoryIndex = signal(0);
  protected searchEmoji = signal('');

  ngOnInit(): void {
    this.httpService.getEmoji().subscribe((res) => {
      const categorizedEmojis: Record<string, EmojiStructure[]> = this.categoryNames.reduce((acc, category) => {
        acc[category] = [];
        return acc;
      }, {} as Record<string, EmojiStructure[]>);
      this.emojiContent.set(res.reduce(
        (acc: Record<string, EmojiStructure[]>, emoji: EmojiStructure) => {
          acc[emoji.category].push(emoji);
          return acc;
        },
        categorizedEmojis,
      ));
    });
  }

  // Category names in the same order as categorizedEmojis keys
  protected readonly categoryNames: string[] = [
    'Smileys & Emotion',
    'Animals & Nature',
    'Food & Drink',
    'Activities',
    'Travel & Places',
    'Objects',
    'Symbols',
    'Flags',
    'Component',
    'People & Body',
  ];

  // Maps each category name to its heading row index in emojiRows
  protected categoryHeadingIndices: Map<string, number> = new Map();

  protected scrollToCategory(categoryName: string) {
    const rowIndex = this.categoryHeadingIndices.get(categoryName);
    if (rowIndex == null) return;
    this.viewportRef()?.scrollToIndex(rowIndex, 'smooth');
  }

  protected onEmojiScroll() {
    const viewport = this.viewportRef();
    if (!viewport) return;
    const scrollOffset = viewport.measureScrollOffset('top');
    const itemSize = 40;
    const currentIndex = Math.floor(scrollOffset / itemSize);

    // Find the last heading at or before currentIndex
    let activeCategoryIdx = 0;
    for (let i = 0; i < this.categoryNames.length; i++) {
      const headingRow = this.categoryHeadingIndices.get(this.categoryNames[i]);
      if (headingRow != null && headingRow <= currentIndex) {
        activeCategoryIdx = i;
      } else {
        break;
      }
    }
    this.selectedCategoryIndex.set(activeCategoryIdx);
  }

  protected insertEmoji(unifiedEmoji: string) {}
}
