// arithmetic/types.ts

export interface Question {
    text: string;
    answer: number;
    choices: number[];
  }
  
  export type Difficulty = "easy" | "normal" | "hard";
  
  export interface DifficultyConfig {
    name: string;
    description: string;
    coin: number;
    localIndex: number;
    backendIndex: number;
  }
  