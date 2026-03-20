import { Pipe, PipeTransform } from '@angular/core';
import { EmojiStructure } from '../wysiwyg2.models';

@Pipe({
  name: 'unicodeToEmoji',
})
export class UnicodeToEmojiPipe implements PipeTransform {
  transform(emoji: EmojiStructure, tone?: string | null): string {
    if (tone && emoji.skin_variations && emoji.skin_variations[tone]) {
      return emoji.skin_variations[tone].unified
        .split('-')
        .map((u) => String.fromCodePoint(parseInt(u, 16)))
        .join('');
    }
    return emoji.unified
      .split('-')
      .map((u) => String.fromCodePoint(parseInt(u, 16)))
      .join('');
  }
}
