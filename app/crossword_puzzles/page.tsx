"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";

// 게임 타입 정의
interface Word {
  id: number;
  word: string;
  hint: string;
  direction: "horizontal" | "vertical";
  start_row: number;
  start_col: number;
}

interface Puzzle {
  puzzle_id: number;
  difficulty: "easy" | "medium" | "hard";
  size: number;
  words: Word[];
  grid: string[][];
  solution: string[][];
  solo_words: string[];
}

function CrosswordPuzzles() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [usedLetters, setUsedLetters] = useState<Set<number>>(new Set());
  const [cellToLetterIndex, setCellToLetterIndex] = useState<
    Map<string, number>
  >(new Map());
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [completedGames, setCompletedGames] = useState<boolean[]>([
    false,
    false,
    false,
  ]); // [easy, medium, hard]

  // 난이도별 설정
  const DIFFICULTY_CONFIGS = {
    easy: { name: "쉬움", coins: 5, localIndex: 0, backendIndex: 4 },
    medium: { name: "보통", coins: 8, localIndex: 1, backendIndex: 5 },
    hard: { name: "어려움", coins: 12, localIndex: 2, backendIndex: 6 },
  };
  const params = useParams();

  //있으면 로그인아이디, 아니면 패스워드
  const loginId: string = params.loginId
    ? (params.loginId as string)
    : "691a90ead813df88a787f905";

  const completedGame = async (
    loginId: string,
    index: number,
    completed: boolean
  ) => {
    try {
      await patchCompletedGame(loginId, index, completed);
    } catch (error) {
      console.error("게임 완료 업데이트 실패:", error);
    }
  };

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
          data[DIFFICULTY_CONFIGS.medium.backendIndex],
          data[DIFFICULTY_CONFIGS.hard.backendIndex],
        ]);
      } catch (error) {
        console.error("게임 완료 조회 실패:", error);
      }
    };
    getCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDifficultySelect]); // 난이도 선택 화면으로 돌아올 때마다 새로고침

  // 퍼즐 로드
  useEffect(() => {
    fetch("/crossword_puzzles.json")
      .then((response) => response.json())
      .then((data: Puzzle[]) => {
        setPuzzles(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("퍼즐 로딩 실패:", error);
        setLoading(false);
      });
  }, []);

  // 난이도 선택 및 랜덤 퍼즐 시작
  const startGameWithDifficulty = (difficulty: string) => {
    const difficultyPuzzles = puzzles.filter(
      (p) => p.difficulty === difficulty
    );
    if (difficultyPuzzles.length === 0) return;

    // 랜덤하게 퍼즐 선택
    const randomPuzzle =
      difficultyPuzzles[Math.floor(Math.random() * difficultyPuzzles.length)];

    setCurrentPuzzle(randomPuzzle);
    initializeUserGrid(randomPuzzle);
    setShowDifficultySelect(false);
    setGameCompleted(false);
    setSelectedCell(null);
    setUsedLetters(new Set());
    setCellToLetterIndex(new Map());
    setSelectedWord(null);
    setShowHint(false);
  };

  // 사용자 그리드 초기화
  const initializeUserGrid = (puzzle: Puzzle) => {
    const newGrid = puzzle.grid.map((row) =>
      row.map((cell) => {
        if (cell === "" || cell === "?") {
          return ""; // 빈칸으로 설정 (? 도 빈칸으로 처리)
        }
        return cell; // 이미 채워진 글자는 그대로
      })
    );
    setUserGrid(newGrid);
    generateAvailableLetters(puzzle);
  };

  // 사용 가능한 글자 후보군 생성
  const generateAvailableLetters = (puzzle: Puzzle) => {
    // solo_words가 있으면 그것을 사용, 없으면 기존 방식
    if (puzzle.solo_words && puzzle.solo_words.length > 0) {
      // solo_words를 섞어서 전체 사용
      const shuffled = [...puzzle.solo_words].sort(() => Math.random() - 0.5);
      setAvailableLetters(shuffled);
    } else {
      // 기존 방식 (fallback)
      const allLetters = new Set<string>();

      // 모든 단어에서 글자 추출
      puzzle.words.forEach((word) => {
        for (const letter of word.word) {
          allLetters.add(letter);
        }
      });

      // 배열로 변환하고 섞기
      const lettersArray = Array.from(allLetters);
      const shuffled = lettersArray.sort(() => Math.random() - 0.5);

      // 12개 글자로 제한 (2줄 × 6개)
      setAvailableLetters(shuffled);
    }
  };

  // 시작 좌표인지 확인
  const isStartCell = (row: number, col: number) => {
    if (!currentPuzzle) return null;
    return currentPuzzle.words.find(
      (word) => word.start_row === row && word.start_col === col
    );
  };

  // 셀 클릭 핸들러
  const handleCellClick = (row: number, col: number) => {
    if (!currentPuzzle) return;

    const originalCell = currentPuzzle.grid[row][col];
    // X가 아닌 모든 칸 선택 가능 (빈칸이거나 이미 채워진 글자)
    if (originalCell !== "X") {
      setSelectedCell({ row, col });

      // 시작 좌표인지 확인
      const wordAtStart = isStartCell(row, col);
      if (wordAtStart) {
        setSelectedWord(wordAtStart);
        setShowHint(false); // 힌트는 초기화
      } else {
        setSelectedWord(null);
        setShowHint(false);
      }
    }
  };

  // 글자 선택 핸들러
  const handleLetterSelect = (letter: string, letterIndex: number) => {
    if (!selectedCell || !currentPuzzle) return;

    const { row, col } = selectedCell;
    const originalCell = currentPuzzle.grid[row][col];

    // 빈 칸에만 글자 입력 가능
    if (originalCell === "" || originalCell === "?") {
      const cellKey = `${row}-${col}`;

      // 이미 해당 칸에 글자가 있다면 이전 글자를 복구
      const existingLetter = userGrid[row][col];
      if (existingLetter) {
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

      // 새로운 글자 사용 처리
      setUsedLetters((prev) => new Set([...prev, letterIndex]));
      setCellToLetterIndex((prev) => new Map(prev).set(cellKey, letterIndex));

      checkCompletion(newGrid);
    }
  };

  // 글자 삭제 핸들러
  const handleLetterDelete = () => {
    if (!selectedCell || !currentPuzzle) return;

    const { row, col } = selectedCell;
    const originalCell = currentPuzzle.grid[row][col];

    // 빈 칸에서만 삭제 가능
    if (originalCell === "" || originalCell === "?") {
      const cellKey = `${row}-${col}`;
      const letterIndex = cellToLetterIndex.get(cellKey);

      if (letterIndex !== undefined) {
        // 삭제된 글자를 다시 사용 가능하게 만들기
        setUsedLetters((prev) => {
          const newSet = new Set(prev);
          newSet.delete(letterIndex);
          return newSet;
        });

        // 셀-글자 매핑 제거
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
  // 정답 확인 함수
  const isCorrectAnswer = (row: number, col: number, letter: string) => {
    if (!currentPuzzle || !currentPuzzle.solution) return false;
    return currentPuzzle.solution[row][col] === letter;
  };

  // 게임 완료 체크
  const checkCompletion = (grid: string[][]) => {
    if (!currentPuzzle || !currentPuzzle.solution) return;

    // solution과 현재 그리드 비교
    const isComplete = currentPuzzle.solution.every((row, rowIndex) =>
      row.every((cell, colIndex) => {
        if (cell === "") return true; // 빈칸은 무시
        return grid[rowIndex][colIndex] === cell;
      })
    );

    if (isComplete) {
      setGameCompleted(true);
    }
  };

  const handleReset = () => {
    if (currentPuzzle) {
      initializeUserGrid(currentPuzzle);
      setSelectedCell(null);
      setUsedLetters(new Set());
      setCellToLetterIndex(new Map());
      setSelectedWord(null);
      setShowHint(false);
    }
  };
  // 난이도 선택 화면
  if (showDifficultySelect) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5F1E8" }}>
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
          }
        `}</style>

        <div className="w-[90%] max-w-2xl mx-auto p-[2vh]">
          {/* 헤더 */}
          <div className="bg-white rounded-3xl p-[3vh] mb-[3vh] shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-purple-500 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
                <div className="text-white text-[7vw] font-bold">🧩</div>
              </div>
              <h1 className="text-[6vw] font-bold text-gray-800 mb-[1vh]">
                가로세로 퍼즐
              </h1>
              <p className="text-gray-600 text-[3.5vw] mb-[0.5vh]">빈칸을 채워서</p>
              <p className="text-gray-600 text-[3.5vw]">단어를 완성해보세요!</p>
            </div>

            {/* 난이도 선택 */}
            <div className="mt-[3vh]">
              <h2 className="text-[3.5vw] font-bold text-gray-800 text-center mb-[2vh]">
                난이도 선택
              </h2>
              <div className="space-y-[1.5vh]">
                {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={`w-full p-[2vh] rounded-2xl transition-all ${
                      selectedDifficulty === key
                        ? "bg-purple-500 border-2 border-purple-500"
                        : completedGames[config.localIndex]
                        ? "border-2 border-[#6ead79]"
                        : "bg-white border-2 border-gray-300 hover:border-gray-400"
                    } shadow-sm hover:shadow-md`}
                  >
                    <div className="text-center">
                      <div
                        className={`font-bold text-[4vw] text-gray-800 ${
                          selectedDifficulty === key ? "text-white" : ""
                        }`}
                      >
                        {config.name}
                        <p className="text-[2.5vw]">
                          {completedGames[config.localIndex] && (
                            <span
                              className={`${
                                selectedDifficulty === key
                                  ? "text-white"
                                  : "text-[#6ead79]"
                              }`}
                            >
                              게임 진행은 가능하지만, 코인은 제공되지 않습니다.
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-orange-600 font-semibold mt-[1vh]">
                        <span className="text-[3.5vw]">🪙</span>
                        <span
                          className={`text-[3.5vw] ${
                            selectedDifficulty === key
                              ? "text-white"
                              : completedGames[config.localIndex]
                              ? "text-[#6ead79]"
                              : "text-red-400"
                          }`}
                        >
                          {config.coins}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 게임 시작 버튼 */}
              <div className="mt-[3vh]">
                <button
                  onClick={() =>
                    startGameWithDifficulty(selectedDifficulty as string)
                  }
                  className={`w-[90%] mx-auto block py-[2vh] rounded-full font-bold text-[3.5vw] transition-colors shadow-lg ${
                    selectedDifficulty
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  게임 시작
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 게임 완료 화면
  if (gameCompleted) {
    completedGame(
      loginId,
      DIFFICULTY_CONFIGS[selectedDifficulty as keyof typeof DIFFICULTY_CONFIGS]
        .backendIndex,
      true
    );
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[2vh]"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-[4vh] rounded-2xl shadow-2xl text-center w-[90%] max-w-2xl">
          <div className="text-[10vw] mb-[2vh]">🎉</div>
          <h2 className="text-[5vw] font-bold text-gray-800 mb-[2vh]">완료!</h2>
          <p className="text-[3vw] mb-[3vh] text-gray-600">
            모든 단어를 완성했습니다!
          </p>
          <div className="space-y-[1.5vh]">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-semibold"
            >
              다른 난이도 선택
            </button>
            <button
              onClick={() => (window.location.href = "/crossword_puzzles")}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              메인화면으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="text-center">
          <div className="w-[10vw] h-[10vw] border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-[2vh]"></div>
          <p className="text-[3vw] text-gray-600">퍼즐을 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div
      className="min-h-screen p-[2vh]"
      style={{
        backgroundColor: "#F5F1E8",
      }}
    >
      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }
        .crossword-cell {
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
      `}</style>

      <div className="w-[90%] max-w-2xl mx-auto mt-[3vh]">
        {/* 게임 그리드 */}
        <div className="bg-white rounded-2xl p-[2vh] shadow-lg mb-[3vh]">
          <div
            className="grid gap-[0.5vw] mx-auto"
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle?.size || 5}, 1fr)`,
              maxWidth: "min(90vw, 600px)",
              width: "100%",
            }}
          >
            {currentPuzzle?.grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const userCell = userGrid[rowIndex]?.[colIndex] || "";
                const isSelected =
                  selectedCell?.row === rowIndex &&
                  selectedCell?.col === colIndex;
                const isBlank = cell === "" || cell === "?";
                const isBlockedCell = cell === "X";
                const isFixed = !isBlank && !isBlockedCell;
                const isCorrect =
                  userCell &&
                  isBlank &&
                  isCorrectAnswer(rowIndex, colIndex, userCell);

                const wordAtCell = isStartCell(rowIndex, colIndex);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`crossword-cell aspect-square border-2 transition-all duration-150 rounded-lg flex items-center justify-center font-bold text-[3vw] relative ${
                      isBlockedCell
                        ? "border-gray-500 bg-gray-500 cursor-default"
                        : isCorrect
                        ? "border-green-500 bg-green-100 cursor-pointer"
                        : isBlank
                        ? isSelected
                          ? "border-purple-500 bg-purple-100 cursor-pointer"
                          : "border-gray-300 bg-white hover:border-gray-400 cursor-pointer"
                        : isSelected
                        ? "border-purple-500 bg-purple-50 cursor-pointer"
                        : "border-gray-400 bg-gray-100 hover:border-purple-300 cursor-pointer"
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {/* 시작 좌표 번호 표시 */}
                    {wordAtCell && (
                      <span className="absolute top-[0%] left-[5%] text-[1.5vw] text-purple-600 font-bold">
                        {wordAtCell.id}
                      </span>
                    )}

                    {isBlockedCell ? (
                      ""
                    ) : isFixed ? (
                      <span className="text-gray-700 text-[3vw]">{cell}</span>
                    ) : (
                      <span
                        className={`text-[3vw] ${
                          userCell
                            ? isCorrectAnswer(rowIndex, colIndex, userCell)
                              ? "text-green-600 font-bold"
                              : "text-purple-600"
                            : "text-gray-400"
                        }`}
                      >
                        {userCell}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 글자 선택 패널 */}
        <div className="bg-white rounded-2xl p-[2vh] shadow-sm mb-[3vh]">
          {/* 글자 후보군 */}
          <div className="grid grid-cols-6 gap-[1vw] mb-[2vh]">
            {availableLetters.map((letter, index) => {
              const isUsed = usedLetters.has(index);
              const canSelect =
                selectedCell &&
                (currentPuzzle?.grid[selectedCell.row][selectedCell.col] ===
                  "" ||
                  currentPuzzle?.grid[selectedCell.row][selectedCell.col] ===
                    "?");

              return (
                <div key={index} className="aspect-square">
                  <button
                    onClick={() => handleLetterSelect(letter, index)}
                    disabled={!canSelect || isUsed}
                    className={`w-full h-full rounded-lg font-bold text-[3.5vw] transition-all duration-300 ease-in-out transform ${
                      isUsed
                        ? "scale-0 opacity-0 pointer-events-none"
                        : canSelect
                        ? "scale-100 opacity-100 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:scale-105 active:scale-95"
                        : "scale-100 opacity-100 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {letter}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 힌트 영역 */}
        {selectedWord && (
          <div className="bg-purple-50 rounded-xl p-[2vh] mb-[1.5vh] border-2 border-purple-200">
            <div className="flex items-center justify-between mb-[1vh]">
              <div className="flex items-center gap-2">
                <span className="text-[2vw] font-bold text-purple-600 bg-purple-200 rounded-full w-[5vw] h-[5vw] flex items-center justify-center">
                  {selectedWord.id}
                </span>
                <span className="text-[2.5vw] font-semibold text-gray-700">
                  {selectedWord.direction === "horizontal" ? "가로" : "세로"}
                </span>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-[2vw] py-[1vh] bg-purple-500 text-white rounded-lg text-[2.5vw] font-semibold hover:bg-purple-600 transition-colors"
              >
                {showHint ? "힌트 숨기기" : "💡 힌트 보기"}
              </button>
            </div>

            {showHint && (
              <div className="p-[1.5vh] bg-white rounded-lg border border-purple-200">
                <p className="text-[2.5vw] text-gray-600 mb-[0.5vh]">💬 힌트</p>
                <p className="text-[3vw] text-gray-700">{selectedWord.hint}</p>
              </div>
            )}
          </div>
        )}

        {/* 삭제 버튼 */}
        <button
          onClick={handleLetterDelete}
          disabled={
            !selectedCell ||
            (selectedCell &&
              currentPuzzle?.grid[selectedCell.row][selectedCell.col] !== "" &&
              currentPuzzle?.grid[selectedCell.row][selectedCell.col] !== "?")
          }
          className={`w-full py-[2vh] text-[3vw] rounded-xl font-semibold transition-colors ${
            selectedCell &&
            (currentPuzzle?.grid[selectedCell.row][selectedCell.col] === "" ||
              currentPuzzle?.grid[selectedCell.row][selectedCell.col] === "?")
              ? "bg-red-400 text-white hover:bg-red-500"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          🗑️ 지우기
        </button>
        <button
          onClick={handleReset}
          className="w-full mt-[1.5vh] py-[2vh] text-[3vw] rounded-xl font-semibold transition-colors bg-purple-400 text-white hover:bg-purple-500"
        >
          🔄 전체 초기화
        </button>
      </div>

      <div className="mt-[5vh]"></div>
    </div>
  );
}

export default CrosswordPuzzles;
