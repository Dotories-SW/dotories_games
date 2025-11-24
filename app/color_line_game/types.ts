// game/color-line/types.ts
export type CellType = "empty" | "dot" | "path";

export type Color =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "cyan"
  | "magenta"
  | "lime"
  | "brown";

export interface GameCell {
  type: CellType;
  color?: Color;
}

export interface PuzzleData {
  grid: GameCell[][];
  pairs: Array<{ color: Color; dots: Array<[number, number]> }>;
}

export interface PuzzleConfig {
  puzzle_id: number;
  size: number;
  colors: Array<{
    color: Color;
    start_x: number;
    start_y: number;
    end_x: number;
    end_y: number;
  }>;
}
