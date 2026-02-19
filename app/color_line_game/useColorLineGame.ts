// game/color-line/useColorLineGame.ts
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CellType,
  Color,
  GameCell,
  PuzzleConfig,
  PuzzleData,
} from "./types";
import { generateFlowFreePuzzleFromConfig } from "./utils";
import { patchCompletedGame } from "../_api/gameApi";

const LEVEL_CONFIGS = [
  { level: 1, name: "easy", size: "5×5", coin: 5 },
  { level: 2, name: "normal", size: "6×6", coin: 8 },
  { level: 3, name: "hard", size: "7×7", coin: 12 },
] as const;

export function useColorLineGame() {
  const [puzzles, setPuzzles] = useState<PuzzleConfig[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleConfig | null>(null);
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [gameGrid, setGameGrid] = useState<GameCell[][]>([]);
  const [loading, setLoading] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<Color | null>(null);
  const [currentPath, setCurrentPath] = useState<Array<[number, number]>>([]);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [completedColors, setCompletedColors] = useState<Set<Color>>(
    () => new Set()
  );

  const [showLevelSelect, setShowLevelSelect] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const abortControllerRef = useRef<AbortController | null>(null);
  const gameCompletionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (gameCompletionTimeoutRef.current) clearTimeout(gameCompletionTimeoutRef.current);
    };
  }, []);

  // 레벨 선택
  const selectLevel = (level: number) => {
    setSelectedLevel(level);
  };

  // 인접 셀 체크
  const isAdjacent = useCallback(
    ([r1, c1]: [number, number], [r2, c2]: [number, number]): boolean => {
      return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    },
    []
  );

  // 인접 셀 가져오기
  const getAdjacentCells = useCallback(
    (row: number, col: number): Array<[number, number]> => {
      if (!currentPuzzle) return [];
      return [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ].filter(
        ([r, c]) =>
          r >= 0 && r < currentPuzzle.size && c >= 0 && c < currentPuzzle.size
      ) as Array<[number, number]>;
    },
    [currentPuzzle]
  );

  // BFS로 실제 경로 연결 확인
  const checkPathConnectionBFS = useCallback(
    (
      dot1: [number, number],
      dot2: [number, number],
      color: Color,
      grid: GameCell[][]
    ): boolean => {
      const [startR, startC] = dot1;
      const [endR, endC] = dot2;

      const queue: Array<[number, number]> = [[startR, startC]];
      const visited = new Set<string>();
      visited.add(`${startR},${startC}`);

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;

        if (r === endR && c === endC) return true;

        const adjacentCells = getAdjacentCells(r, c);
        for (const [nr, nc] of adjacentCells) {
          const key = `${nr},${nc}`;
          if (visited.has(key)) continue;

          const cell = grid[nr][nc];
          if (
            (cell.type === "path" && cell.color === color) ||
            (cell.type === "dot" && cell.color === color)
          ) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
      return false;
    },
    [getAdjacentCells]
  );

  // 게임 완료 체크
  const checkGameCompletion = useCallback(() => {
    if (!puzzleData || !currentPuzzle) return;

    const connectedColors = new Set<Color>();

    const connectedCount = puzzleData.pairs.filter((pair) => {
      const [dot1, dot2] = pair.dots;
      const connected = checkPathConnectionBFS(
        dot1,
        dot2,
        pair.color,
        gameGrid
      );
      if (connected) connectedColors.add(pair.color);
      return connected;
    }).length;

    setCompletedColors(connectedColors);

    const totalCells = currentPuzzle.size * currentPuzzle.size;
    const filledCells = gameGrid
      .flat()
      .filter((cell) => cell.type !== "empty").length;

    const allConnected = connectedCount === puzzleData.pairs.length;
    const allFilled = filledCells === totalCells;

    if (allConnected && allFilled) {
      setCompletionTime(currentTime);
      setGameCompleted(true);
    }
  }, [
    puzzleData,
    currentPuzzle,
    gameGrid,
    currentTime,
    checkPathConnectionBFS,
  ]);

  // 레벨에 맞는 퍼즐 로드 & 시작
  const startGame = () => {
    const levelConfig = LEVEL_CONFIGS.find(
      (config) => config.level === selectedLevel
    );
    if (!levelConfig) return;

    setLoading(true);
    const difficultyFileName = `color_line_game_${levelConfig.name}.json`;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetch(`/game_json/color_line_game/${difficultyFileName}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: PuzzleConfig[]) => {
        setPuzzles(data);

        const randomIndex = Math.floor(Math.random() * data.length);
        const puzzle = data[randomIndex];

        if (!puzzle) {
          console.error("퍼즐을 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        const generated = generateFlowFreePuzzleFromConfig(puzzle);

        setCurrentPuzzle(puzzle);
        setPuzzleData(generated);
        setGameGrid(generated.grid);
        setShowLevelSelect(false);
        setGameCompleted(false);
        setIsDrawing(false);
        setCurrentColor(null);
        setCurrentPath([]);
        setCompletedColors(new Set());
        setCurrentTime(0);
        setStartTime(Date.now());
        setLoading(false);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.error("퍼즐 로딩 실패:", error);
        setLoading(false);
      });
  };

  // 실시간 타이머
  useEffect(() => {
    if (!gameCompleted && !showLevelSelect && startTime !== null) {
      const timer = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameCompleted, showLevelSelect, startTime]);

  // 미완성 & 특정 색 경로 제거
  const clearPathsBeforeStart = (startingColor: Color) => {
    if (!puzzleData) return;

    const newGrid = gameGrid.map((row) => row.map((cell) => ({ ...cell })));

    // 1. 모든 색의 미완성 경로 제거
    puzzleData.pairs.forEach((pair) => {
      const [dot1, dot2] = pair.dots;
      const isConnected = checkPathConnectionBFS(
        dot1,
        dot2,
        pair.color,
        newGrid
      );

      if (!isConnected) {
        for (let r = 0; r < newGrid.length; r++) {
          for (let c = 0; c < newGrid[r].length; c++) {
            if (
              newGrid[r][c].type === "path" &&
              newGrid[r][c].color === pair.color
            ) {
              newGrid[r][c] = { type: "empty" as CellType };
            }
          }
        }
      }
    });

    // 2. 시작하려는 색상의 경로 전부 제거
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[r].length; c++) {
        if (
          newGrid[r][c].type === "path" &&
          newGrid[r][c].color === startingColor
        ) {
          newGrid[r][c] = { type: "empty" as CellType };
        }
      }
    }

    setGameGrid(newGrid);
  };

  // 드래그 시작
  const handleStart = (row: number, col: number) => {
    const cell = gameGrid[row][col];
    if (cell.type === "dot" && cell.color) {
      clearPathsBeforeStart(cell.color);
      setIsDrawing(true);
      setCurrentColor(cell.color);
      setCurrentPath([[row, col]]);
    }
  };

  // 이동 처리
  const handleMove = useCallback(
    (row: number, col: number) => {
      if (!isDrawing || !currentColor) return;

      const cell = gameGrid[row][col];

      // 같은 색상의 다른 점에 도달 (연결 완성)
      if (cell.type === "dot" && cell.color === currentColor) {
        const startPos = currentPath[0];
        if (startPos && (startPos[0] !== row || startPos[1] !== col)) {
          setIsDrawing(false);
          setCurrentColor(null);
          setCurrentPath([]);
          if (gameCompletionTimeoutRef.current) clearTimeout(gameCompletionTimeoutRef.current);
          gameCompletionTimeoutRef.current = setTimeout(() => {
            gameCompletionTimeoutRef.current = null;
            checkGameCompletion();
          }, 100);
          return;
        }
      }

      // 다른 색상의 점/경로는 차단
      if (
        (cell.type === "dot" && cell.color !== currentColor) ||
        (cell.type === "path" && cell.color !== currentColor)
      ) {
        return;
      }

      if (
        cell.type === "empty" ||
        (cell.type === "path" && cell.color === currentColor)
      ) {
        const lastPos = currentPath[currentPath.length - 1];
        if (lastPos && isAdjacent(lastPos, [row, col])) {
          // 되돌아가기
          if (currentPath.length > 1) {
            const prevPos = currentPath[currentPath.length - 2];
            if (prevPos[0] === row && prevPos[1] === col) {
              const newGrid = [...gameGrid];
              newGrid[lastPos[0]][lastPos[1]] = { type: "empty" };
              setGameGrid(newGrid);
              setCurrentPath((prev) => prev.slice(0, -1));
              return;
            }
          }

          // 새 경로
          if (!currentPath.some(([r, c]) => r === row && c === col)) {
            const newGrid = [...gameGrid];
            newGrid[row][col] = { type: "path", color: currentColor };
            setGameGrid(newGrid);
            setCurrentPath((prev) => [...prev, [row, col]]);
          }
        }
      }
    },
    [
      isDrawing,
      currentColor,
      gameGrid,
      currentPath,
      checkGameCompletion,
      isAdjacent,
    ]
  );

  // 터치용: 터치 → (row, col)
  const getTouchCellPosition = useCallback(
    (touch: React.Touch, gridElement: HTMLElement): [number, number] | null => {
      if (!currentPuzzle) return null;

      const rect = gridElement.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const gridSize = currentPuzzle.size;
      const cellSize = rect.width / gridSize;

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        return [row, col];
      }
      return null;
    },
    [currentPuzzle]
  );

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!isDrawing || e.touches.length === 0 || !currentColor) return;

    const touch = e.touches[0];
    const gridElement = e.currentTarget as HTMLElement;
    const position = getTouchCellPosition(touch, gridElement);

    if (position) {
      const [row, col] = position;
      handleMove(row, col);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setCurrentColor(null);
    setCurrentPath([]);
  };

  // 터치 스크롤 방지
  useEffect(() => {
    const preventDefault = (e: Event) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });
    document.addEventListener("touchstart", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
      document.removeEventListener("touchstart", preventDefault);
    };
  }, [isDrawing]);

  const resetGame = () => {
    if (!puzzleData) return;
    setGameGrid(puzzleData.grid);
    setIsDrawing(false);
    setCurrentColor(null);
    setCurrentPath([]);
    setCompletedColors(new Set());
    setCurrentTime(0);
    setStartTime(Date.now());
    setGameCompleted(false);
  };

  return {
    // 상수 / 설정
    LEVEL_CONFIGS,
    // 상태
    showLevelSelect,
    selectedLevel,
    loading,
    gameCompleted,
    completionTime,
    currentTime,
    currentPuzzle,
    puzzleData,
    gameGrid,
    completedColors,
    // 액션/핸들러
    selectLevel,
    startGame,
    setShowLevelSelect,
    handleStart,
    handleMove,
    handleTouchMove,
    handleEnd,
    resetGame,
  };
}
