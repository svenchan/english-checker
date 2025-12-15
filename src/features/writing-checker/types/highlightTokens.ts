export type HighlightSpan = {
  id: string;
  start: number;
  end: number;
  category?: string;
};

export type TextToken = {
  kind: "text";
  value: string;
};

export type MistakeToken = {
  kind: "mistake";
  value: string;
  mistakeId: string;
  category?: string;
};

export type HighlightToken = TextToken | MistakeToken;
