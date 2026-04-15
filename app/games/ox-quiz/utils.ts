import type { OxQuestion, Difficulty } from "./types";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
};

export function pickRandomQuestion(questions: OxQuestion[]): OxQuestion {
  return questions[Math.floor(Math.random() * questions.length)];
}
