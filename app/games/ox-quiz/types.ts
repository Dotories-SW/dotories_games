export type Difficulty = "easy" | "normal" | "hard";

export interface OxQuestion {
  id: number;
  question: string;
  answer: boolean;
  explanation: string;
}
