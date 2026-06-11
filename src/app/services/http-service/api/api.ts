import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Api {
  get sidebarItemConfig() {
    return 'assets/data/sidebarItemConfig.json';
  }

  get wysiwygEditorConfig() {
    return 'assets/data/wysiwygEditorConfig.json';
  }

  get emoji() {
    return 'assets/data/emoji.json';
  }
}
