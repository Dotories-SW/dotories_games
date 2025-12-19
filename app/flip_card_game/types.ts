// flip-card/types.ts

export interface Card {
    id: number;
    name: string;
    src: string;
  }
  
  export interface GameData {
    backImage: string;
    cards: Card[];
    difficulty: {
      easy: number;
      normal: number;
      hard: number;
    };
  }
  
  export type Difficulty = "easy" | "normal" | "hard";
  
  export interface DifficultyConfig {
    name: string;
    pairs: number;
    cards: number;
    coin: number;
    defaultScore: number;
    localIndex: number;
    backendIndex: number;
  }
  