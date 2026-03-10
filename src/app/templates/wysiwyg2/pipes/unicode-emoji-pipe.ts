import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unicodeToEmoji',
})
export class UnicodeToEmojiPipe implements PipeTransform {
  transform(unified: string): string {
    return unified
      .split('-')
      .map((u) => String.fromCodePoint(parseInt(u, 16)))
      .join('');
  }
}
