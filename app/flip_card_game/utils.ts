// flip-card/utils.ts
import type { Card, Difficulty, DifficultyConfig } from "./types";

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: "쉬움",
    pairs: 4,
    cards: 8,
    coin: 5,
    localIndex: 0,
    backendIndex: 7,
  },
  normal: {
    name: "보통",
    pairs: 8,
    cards: 16,
    coin: 8,
    localIndex: 1,
    backendIndex: 8,
  },
  hard: {
    name: "어려움",
    pairs: 10,
    cards: 20,
    coin: 12,
    localIndex: 2,
    backendIndex: 9,
  },
};

// 카드 섞기
export const shuffleCards = (cards: Card[]): Card[] => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
