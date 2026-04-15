export interface HiddenItem {
  id: string;
  name: string;
  x: number; // 0~1, 이미지 너비 비율
  y: number; // 0~1, 이미지 높이 비율
}

export interface Puzzle {
  id: number;
  image: string;
  items: HiddenItem[];
}

export interface PuzzleData {
  puzzles: Puzzle[];
}

export interface FoundCircle {
  itemId: string;
  x: number; // 0~1
  y: number; // 0~1
}

export interface MissMarker {
  id: string;
  x: number; // 0~1
  y: number; // 0~1
}
