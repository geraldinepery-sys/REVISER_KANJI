
export enum StoryType {
  MODERN = "現在な物語",
  FANTASY = "ファンタジー物語",
  CONVERSATION = "会話"
}

export enum Tense {
  PAST = "過去形",
  PRESENT = "現在形",
  FUTURE = "未来形"
}

export enum Language {
  FR = "fr",
  EN = "en",
  ES = "es",
  IT = "it",
  DE = "de",
  PL = "pl",
  PT = "pt"
}

export interface WordEntry {
  raw: string;
  kanji: string;
  reading: string;
  meaning: string;
}

export interface KanjiDetails {
  kanji: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  jishoLink: string;
}

export interface AppState {
  inputText: string;
  listeA: string;
  storyType: StoryType;
  tense: Tense;
  generatedText: string;
  listeB: string;
  loading: boolean;
  language: Language;
}
