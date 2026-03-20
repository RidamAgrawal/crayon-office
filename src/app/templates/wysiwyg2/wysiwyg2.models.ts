export interface EmojiStructure {
  name: string;
  unified: string;
  non_qualified: string | null;
  docomo: string | null;
  au: string | null;
  softbank: string | null;
  google: string | null;
  image: string;
  sheet_x: number;
  sheet_y: number;
  short_name: string;
  short_names: string[];
  text: string | null;
  texts: string[] | null;
  category: string;
  subcategory: string;
  sort_order: number;
  added_in: string;
  has_img_apple: boolean;
  has_img_google: boolean;
  has_img_twitter: boolean;
  has_img_facebook: boolean;
  skin_variations: Record<string, EmojiSkinVariation>;
  skin_variations_emoji?: EmojiSkinVariation[];
}
export type EmojiSkinVariation = {
  unified: string;
  non_qualified: string | null;
  image: string;
  sheet_x: number;
  sheet_y: number;
  added_in: string;
  has_img_apple: boolean;
  has_img_google: boolean;
  has_img_twitter: boolean;
  has_img_facebook: boolean;
};

export const RaisedHandEmoji: EmojiStructure = {
  name: 'RAISED HAND',
  unified: '270B',
  non_qualified: null,
  docomo: 'E695',
  au: 'E5A7',
  softbank: 'E012',
  google: 'FEB95',
  image: '270b.png',
  sheet_x: 60,
  sheet_y: 8,
  short_name: 'hand',
  short_names: ['hand', 'raised_hand'],
  text: null,
  texts: null,
  category: 'People & Body',
  subcategory: 'hand-fingers-open',
  sort_order: 173,
  added_in: '0.6',
  has_img_apple: true,
  has_img_google: true,
  has_img_twitter: true,
  has_img_facebook: true,
  skin_variations: {
    '1F3FB': {
      unified: '270B-1F3FB',
      non_qualified: null,
      image: '270b-1f3fb.png',
      sheet_x: 60,
      sheet_y: 9,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    '1F3FC': {
      unified: '270B-1F3FC',
      non_qualified: null,
      image: '270b-1f3fc.png',
      sheet_x: 60,
      sheet_y: 10,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    '1F3FD': {
      unified: '270B-1F3FD',
      non_qualified: null,
      image: '270b-1f3fd.png',
      sheet_x: 60,
      sheet_y: 11,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    '1F3FE': {
      unified: '270B-1F3FE',
      non_qualified: null,
      image: '270b-1f3fe.png',
      sheet_x: 60,
      sheet_y: 12,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    '1F3FF': {
      unified: '270B-1F3FF',
      non_qualified: null,
      image: '270b-1f3ff.png',
      sheet_x: 60,
      sheet_y: 13,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
  },
  skin_variations_emoji: [
    {
      unified: '',
      non_qualified: null,
      image: '270b.png',
      sheet_x: 60,
      sheet_y: 8,
      added_in: '0.6',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    {
      unified: '1F3FB',
      non_qualified: null,
      image: '270b-1f3fb.png',
      sheet_x: 60,
      sheet_y: 9,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    {
      unified: '1F3FC',
      non_qualified: null,
      image: '270b-1f3fc.png',
      sheet_x: 60,
      sheet_y: 10,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    {
      unified: '1F3FD',
      non_qualified: null,
      image: '270b-1f3fd.png',
      sheet_x: 60,
      sheet_y: 11,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    {
      unified: '1F3FE',
      non_qualified: null,
      image: '270b-1f3fe.png',
      sheet_x: 60,
      sheet_y: 12,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
    {
      unified: '1F3FF',
      non_qualified: null,
      image: '270b-1f3ff.png',
      sheet_x: 60,
      sheet_y: 13,
      added_in: '1.0',
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
    },
  ],
};
export type EmojiRow =
  | { type: 'heading'; name: string }
  | { type: 'emojis'; emojis: EmojiStructure[] };
