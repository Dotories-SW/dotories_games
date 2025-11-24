"use client";

import { useEffect, useRef, useState } from "react";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";
import {
  Difficulty,
  DIFFICULTY_CONFIGS,
  Direction,
  Puzzle,
  Word,
  getDifficultyFileName,
} from "./types";
import { useRouter } from "next/navigation";

interface HistoryState {
  userGrid: string[][];
  usedLetters: Set<number>;
  cellToLetterIndex: Map<string, number>;
  correctCount: number;
}

export function useCrosswordGame(loginId: string) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [usedLetters, setUsedLetters] = useState<Set<number>>(new Set());
  const [cellToLetterIndex, setCellToLetterIndex] = useState<Map<string, number>>(
    new Map()
  );
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [completedGames, setCompletedGames] = useState<boolean[]>([false, false, false]); // [easy, normal, hard]
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalBlanks, setTotalBlanks] = useState<number>(0);

  const [history, setHistory] = useState<HistoryState[]>([]);

  const crosswordSoundRef = useRef<HTMLAudioElement | null>(null);

  // 진행률
  const progress = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
  const router = useRouter();

  // 배경음 초기화
  useEffect(() => {
    crosswordSoundRef.current = new Audio("/sounds/crossword/crossword_bgm.mp3");
    crosswordSoundRef.current.loop = true;
    crosswordSoundRef.current.volume = 0.1;

    return () => {
      if (crosswordSoundRef.current) {
        crosswordSoundRef.current.pause();
        crosswordSoundRef.current = null;
      }
    };
  }, []);

  // 퍼즐 시작 시 빈칸/정답 카운트 초기화 + BGM
  useEffect(() => {
    if (!currentPuzzle) return;

    let count = 0;
    currentPuzzle.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell === "" || cell === "?") {
          count++;
        }
      });
    });
    setTotalBlanks(count);
    setCorrectCount(0);
    crosswordSoundRef.current?.play();
  }, [currentPuzzle]);

  // 완료 여부 조회 (난이도 선택 화면 들어올 때마다)
  useEffect(() => {
    const getCompleted = async () => {
      try {
        const res = await getGameCompleted(loginId);
        let data = res.data;
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        setCompletedGames([
          data[DIFFICULTY_CONFIGS.easy.backendIndex],
          data[DIFFICULTY_CONFIGS.normal.backendIndex],
          data[DIFFICULTY_CONFIGS.hard.backendIndex],
        ]);
      } catch (error) {
        console.error("게임 완료 조회 실패:", error);
      }
    };
    getCompleted();
  }, [loginId, showDifficultySelect]);

  // 게임 완료 시 코인 지급 + BGM 정지
  useEffect(() => {
    const patchWhenComplete = async () => {
      if (!gameCompleted || !selectedDifficulty) return;

      const config = DIFFICULTY_CONFIGS[selectedDifficulty];
      try {
        await patchCompletedGame(loginId, config.backendIndex, true, config.coin);
      } catch (error) {
        console.error("게임 완료 업데이트 실패:", error);
      } finally {
        crosswordSoundRef.current?.pause();
      }
    };

    patchWhenComplete();
  }, [gameCompleted, selectedDifficulty, loginId]);

  // 히스토리 저장
  const saveHistory = () => {
    setHistory((prev) => [
      ...prev,
      {
        userGrid: userGrid.map((row) => [...row]),
        usedLetters: new Set(usedLetters),
        cellToLetterIndex: new Map(cellToLetterIndex),
        correctCount,
      },
    ]);
  };

  // 실행 취소
  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];

      setUserGrid(previousState.userGrid.map((row) => [...row]));
      setUsedLetters(new Set(previousState.usedLetters));
      setCellToLetterIndex(new Map(previousState.cellToLetterIndex));
      setCorrectCount(previousState.correctCount);

      return prev.slice(0, -1);
    });
  };

  // 퍼즐 시작
  const startGameWithDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setLoading(true);

    const fileName = getDifficultyFileName(difficulty);

    fetch(`/game_json/crossword_puzzles/${fileName}`)
      .then((response) => response.json())
      .then((data: Puzzle[]) => {
        setPuzzles(data);

        if (data.length === 0) {
          console.error("퍼즐이 없습니다.");
          setLoading(false);
          return;
        }

        const randomPuzzle = data[Math.floor(Math.random() * data.length)];

        setCurrentPuzzle(randomPuzzle);
        initializeUserGrid(randomPuzzle);
        setShowDifficultySelect(false);
        setGameCompleted(false);
        setSelectedCell(null);
        setUsedLetters(new Set());
        setCellToLetterIndex(new Map());
        setSelectedWords([]);
        setShowHint(false);
        setSelectedDirection(null);
        setHistory([]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("퍼즐 로딩 실패:", error);
        setLoading(false);
      });
  };

  const initializeUserGrid = (puzzle: Puzzle) => {
    const newGrid = puzzle.grid.map((row) =>
      row.map((cell) => {
        if (cell === "" || cell === "?") {
          return "";
        }
        return cell;
      })
    );
    setUserGrid(newGrid);
    generateAvailableLetters(puzzle);
  };

  const generateAvailableLetters = (puzzle: Puzzle) => {
    if (puzzle.solo_words && puzzle.solo_words.length > 0) {
      const shuffled = [...puzzle.solo_words].sort(() => Math.random() - 0.5);
      setAvailableLetters(shuffled);
    } else {
      const allLetters = new Set<string>();

      puzzle.words.forEach((word) => {
        for (const letter of word.word) {
          allLetters.add(letter);
        }
      });

      const lettersArray = Array.from(allLetters);
      const shuffled = lettersArray.sort(() => Math.random() - 0.5);
      setAvailableLetters(shuffled);
    }
  };

  // 해당 칸에서 시작하는 모든 단어
  const getWordsAtCell = (row: number, col: number): Word[] => {
    if (!currentPuzzle) return [];
    return currentPuzzle.words.filter(
      (word) => word.start_row === row && word.start_col === col
    );
  };

  const handleCellClick = (row: number, col: number) => {
    if (!currentPuzzle) return;

    const originalCell = currentPuzzle.grid[row][col];
    if (originalCell !== "X") {
      setSelectedCell({ row, col });

      const wordsAtStart = getWordsAtCell(row, col);
      if (wordsAtStart.length > 0) {
        setSelectedWords(wordsAtStart);
        setShowHint(false);

        const hasHorizontal = wordsAtStart.some((w) => w.direction === "horizontal");
        setSelectedDirection(hasHorizontal ? "horizontal" : "vertical");
      } else {
        setSelectedWords([]);
        setShowHint(false);
        setSelectedDirection(null);
      }
    }
  };

  const isCorrectAnswer = (row: number, col: number, letter: string) => {
    if (!currentPuzzle || !currentPuzzle.solution) return false;
    return currentPuzzle.solution[row][col] === letter;
  };

  const checkCompletion = (grid: string[][]) => {
    if (!currentPuzzle || !currentPuzzle.solution) return;

    const isComplete = currentPuzzle.solution.every((row, rowIndex) =>
      row.every((cell, colIndex) => {
        if (cell === "") return true;
        return grid[rowIndex][colIndex] === cell;
      })
    );

    if (isComplete) {
      setGameCompleted(true);
    }
  };

  const handleLetterSelect = (letter: string, letterIndex: number) => {
    if (!selectedCell || !currentPuzzle) return;

    const { row, col } = selectedCell;
    const originalCell = currentPuzzle.grid[row][col];

    if (originalCell === "" || originalCell === "?") {
      saveHistory();

      const cellKey = `${row}-${col}`;
      const existingLetter = userGrid[row][col];

      if (existingLetter) {
        if (isCorrectAnswer(row, col, existingLetter)) {
          setCorrectCount((prev) => prev - 1);
        }

        const previousLetterIndex = cellToLetterIndex.get(cellKey);
        if (previousLetterIndex !== undefined) {
          setUsedLetters((prev) => {
            const newSet = new Set(prev);
            newSet.delete(previousLetterIndex);
            return newSet;
          });
        }
      }

      const newGrid = [...userGrid];
      newGrid[row][col] = letter;
      setUserGrid(newGrid);

      if (isCorrectAnswer(row, col, letter)) {
        setCorrectCount((prev) => prev + 1);
      }

      setUsedLetters((prev) => new Set([...prev, letterIndex]));
      setCellToLetterIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(cellKey, letterIndex);
        return newMap;
      });

      checkCompletion(newGrid);
    }
  };

  const handleLetterDelete = () => {
    if (!selectedCell || !currentPuzzle) return;

    const { row, col } = selectedCell;
    const originalCell = currentPuzzle.grid[row][col];

    if (originalCell === "" || originalCell === "?") {
      const existingLetter = userGrid[row][col];

      if (existingLetter) {
        saveHistory();

        if (isCorrectAnswer(row, col, existingLetter)) {
          setCorrectCount((prev) => prev - 1);
        }
      }

      const cellKey = `${row}-${col}`;
      const letterIndex = cellToLetterIndex.get(cellKey);

      if (letterIndex !== undefined) {
        setUsedLetters((prev) => {
          const newSet = new Set(prev);
          newSet.delete(letterIndex);
          return newSet;
        });

        setCellToLetterIndex((prev) => {
          const newMap = new Map(prev);
          newMap.delete(cellKey);
          return newMap;
        });
      }

      const newGrid = [...userGrid];
      newGrid[row][col] = "";
      setUserGrid(newGrid);
    }
  };

  const handleReset = () => {
    if (currentPuzzle) {
      initializeUserGrid(currentPuzzle);
      setSelectedCell(null);
      setUsedLetters(new Set());
      setCellToLetterIndex(new Map());
      setSelectedWords([]);
      setShowHint(false);
      setSelectedDirection(null);
      setHistory([]);
      setCorrectCount(0);
    }
  };

  const goToDifficultySelect = () => {
    setShowDifficultySelect(true);
    setGameCompleted(false);
    setCurrentPuzzle(null);
    crosswordSoundRef.current?.pause();
  };

  const handleEndGame = async (mode: string, coin: number) => {
    if (gameCompleted){
      router.back();
      return;
    }
    if (mode === "ads") {
      window.parent.postMessage(
        { type: "fromApp", payload: { advertise: true, coin: coin * 2 } },
        "*"
      );
    }
    if (mode === "noAds") {
      try {
        await patchCompletedGame(loginId, 3, true, coin);
      } catch (e) {
        console.error("patchCompletedGame error", e);
      }
    }
    router.back();
  };

  return {
    // 상태
    puzzles,
    currentPuzzle,
    userGrid,
    loading,
    showDifficultySelect,
    gameCompleted,
    selectedCell,
    availableLetters,
    selectedDifficulty,
    usedLetters,
    selectedWords,
    showHint,
    selectedDirection,
    completedGames,
    correctCount,
    totalBlanks,
    progress,
    history,

    // 액션
    setSelectedDifficulty,
    setShowHint,
    setSelectedDirection,
    startGameWithDifficulty,
    handleCellClick,
    handleLetterSelect,
    handleLetterDelete,
    handleReset,
    undo,
    goToDifficultySelect,
    getWordsAtCell,
    handleEndGame,
  };
}
