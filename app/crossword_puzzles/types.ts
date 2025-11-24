export type Direction = "horizontal" | "vertical";

export type Difficulty = "easy" | "normal" | "hard";

// 게임 타입 정의
export interface Word {
  id: number;
  word: string;
  hint: string;
  direction: Direction;
  start_row: number;
  start_col: number;
}

export interface Puzzle {
  puzzle_id: number;
  difficulty: Difficulty;
  size: number;
  words: Word[];
  grid: string[][];
  solution: string[][];
  solo_words: string[];
}

export interface DifficultyConfig {
  name: string;
  coin: number;
  localIndex: number;
  backendIndex: number;
}

// 난이도별 설정
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { name: "쉬움", coin: 5, localIndex: 0, backendIndex: 4 },
  normal: { name: "보통", coin: 8, localIndex: 1, backendIndex: 5 },
  hard: { name: "어려움", coin: 12, localIndex: 2, backendIndex: 6 },
};

// 난이도별 파일명 매핑
export const getDifficultyFileName = (difficulty: Difficulty): string => {
  const fileNameMap: Record<Difficulty, string> = {
    easy: "crossword_puzzles_easy.json",
    normal: "crossword_puzzles_normal.json",
    hard: "crossword_puzzles_hard.json",
  };
  return fileNameMap[difficulty];
};
