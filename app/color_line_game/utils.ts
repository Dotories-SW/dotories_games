// game/color-line/utils.ts
import { CellType, Color, GameCell, PuzzleConfig, PuzzleData } from "./types";

// JSON에서 퍼즐 생성
export function generateFlowFreePuzzleFromConfig(
  config: PuzzleConfig
): PuzzleData {
  const grid: GameCell[][] = Array(config.size)
    .fill(null)
    .map(() =>
      Array(config.size)
        .fill(null)
        .map(() => ({ type: "empty" as CellType }))
    );

  const pairs: Array<{ color: Color; dots: Array<[number, number]> }> = [];

  config.colors.forEach(({ color, start_x, start_y, end_x, end_y }) => {
    const dots: Array<[number, number]> = [
      [start_y, start_x],
      [end_y, end_x],
    ];

    pairs.push({ color, dots });

    dots.forEach(([row, col]) => {
      grid[row][col] = { type: "dot", color };
    });
  });

  return { grid, pairs };
}

// 색 → 실제 색상 헥사코드
export const getColorStyle = (color: Color): string => {
  const colorMap: Record<Color, string> = {
    red: "#FF6B6B",
    blue: "#4ECDC4",
    green: "#6ead79",
    yellow: "#FFA726",
    purple: "#AB47BC",
    orange: "#FF7043",
    cyan: "#26C6DA",
    magenta: "#EC407A",
    lime: "#9CCC65",
    brown: "#8D6E63",
  };
  return colorMap[color] || "#666";
};
