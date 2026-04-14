import type { HiddenItem } from "./types";

export const HIT_RADIUS = 0.08; // 탭 허용 반경 (이미지 너비 비율)

export const ALL_PUZZLE_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

export function pickRandomPuzzleId(): number {
  return ALL_PUZZLE_IDS[Math.floor(Math.random() * ALL_PUZZLE_IDS.length)];
}

export function checkHit(
  tapXFrac: number,
  tapYFrac: number,
  item: HiddenItem
): boolean {
  const dx = tapXFrac - item.x;
  const dy = tapYFrac - item.y;
  return Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS;
}
