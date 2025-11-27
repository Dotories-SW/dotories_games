// app/crossword_puzzles/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useCrosswordGame } from "./useCrosswordGame";
import { DIFFICULTY_CONFIGS, Difficulty } from "./types";

export default function CrosswordPuzzlesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CrosswordPuzzles />
    </Suspense>
  );
}

function CrosswordPuzzles() {
  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : "691c2eefe90f06e920804f4e";

  const {
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
  } = useCrosswordGame(loginId);

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
          <div className="bg-white rounded-3xl p-[3vh] mb-[3vh] shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-purple-500 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
                <div className="text-white text-[7vw] font-bold">🧩</div>
              </div>
              <h1 className="text-[6vw] font-bold text-gray-800 mb-[1vh]">
                낱말 퀴즈
              </h1>
              <p className="text-gray-600 text-[3.5vw] mb-[0.5vh]">
                빈칸을 채워서
              </p>
              <p className="text-gray-600 text-[3.5vw]">단어를 완성해보세요!</p>
            </div>

            <div className="mt-[3vh]">
              <h2 className="text-[3.5vw] font-bold text-gray-800 text-center mb-[2vh]">
                난이도 선택
              </h2>
              <div className="space-y-[1.5vh]">
                {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(
                  (key) => {
                    const config = DIFFICULTY_CONFIGS[key];
                    const isSelected = selectedDifficulty === key;
                    const isCompleted = completedGames[config.localIndex];

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDifficulty(key)}
                        className={`w-full p-[2vh] rounded-2xl transition-all ${
                          isSelected
                            ? "bg-purple-500 border-2 border-purple-500"
                            : isCompleted
                            ? "border-2 border-[#6ead79]"
                            : "bg-white border-2 border-gray-300 hover:border-gray-400"
                        } shadow-sm hover:shadow-md`}
                      >
                        <div className="text-center">
                          <div
                            className={`font-bold text-[4vw] text-gray-800 ${
                              isSelected ? "text-white" : ""
                            }`}
                          >
                            {config.name}
                            <p className="text-[2.5vw]">
                              {isCompleted && (
                                <span
                                  className={
                                    isSelected ? "text-white" : "text-[#6ead79]"
                                  }
                                >
                                  게임 진행은 가능하지만, 코인은 제공되지
                                  않습니다.
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-orange-600 font-semibold mt-[1vh]">
                            <span className="text-[3.5vw]">🪙</span>
                            <span
                              className={`text-[3.5vw] ${
                                isSelected
                                  ? "text-white"
                                  : isCompleted
                                  ? "text-[#6ead79]"
                                  : "text-red-400"
                              }`}
                            >
                              {config.coin}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-[3vh]">
                <button
                  onClick={() =>
                    selectedDifficulty &&
                    startGameWithDifficulty(selectedDifficulty)
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
              onClick={goToDifficultySelect}
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
            <div className="flex flex-row justify-between">
              <button
                className="w-full mr-[1vw] py-[2vh] border border-purple-500 text-black rounded-xl font-bold text-[4vw] hover:bg-purple-600 transition-colors mt-[1vh] hover:text-white"
                onClick={() =>
                  handleEndGame(
                    "noAds",
                    DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin,
                    DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].backendIndex
                  )
                }
              >
                {completedGames[DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex] ? (
                  <div className="text-[3.5vw]">
                    <span>
                      오늘 코인을 수령하여 <br /> 더 받을 수 없습니다.
                    </span>
                  </div>
                ) : (
                  <span>
                    {DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin}{" "}
                    코인 받기
                  </span>
                )}
              </button>
              {!completedGames[DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex] && (
                <button
                  className="w-full ml-[1vw] py-[2vh] border border-purple-500 text-black rounded-xl font-bold text-[4vw] hover:bg-purple-600 transition-colors mt-[1vh] hover:text-white"
                  onClick={() =>
                    handleEndGame(
                      "ads",
                      DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin,
                      DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].backendIndex
                    )
                  }
                >
                  <div className="text-[3.5vw]">
                    <span>
                      <span>광고 보고</span>
                      <br />
                      <span>코인 두배로 받기</span>
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (loading || !currentPuzzle) {
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

      <div className="w-full max-w-2xl mx-auto mt-[1vh]">
        {/* 프로그레스바 */}
        <div className="bg-white rounded-2xl p-[2vh] shadow-lg mb-[1vh]">
          <div className="flex items-center justify-between mb-[1vh]">
            <div className="flex items-center gap-[1vw]">
              <span className="text-[4vw] font-bold text-gray-700">진행률</span>
              <span className="text-[3.5vw] text-gray-500">
                {correctCount} / {totalBlanks}
              </span>
            </div>
            <span className="text-[3.5vw] font-bold text-purple-600">
              {progress}%
            </span>
          </div>

          <div className="w-full h-[2vh] bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 게임 그리드 */}
        <div className="bg-white rounded-2xl p-[2vh] shadow-lg mb-[1vh]">
          <div
            className="grid gap-[0.5vw] mx-auto"
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle.size}, 1fr)`,
              maxWidth: "min(90vw, 600px)",
              width: "100%",
            }}
          >
            {currentPuzzle.grid.map((row, rowIndex) =>
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
                  currentPuzzle.solution[rowIndex][colIndex] === userCell;

                const wordsAtCell = getWordsAtCell(rowIndex, colIndex);

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
                    {wordsAtCell.length > 0 && (
                      <span className="absolute top-[0%] left-[5%] text-[2vw] text-purple-600 font-semibold">
                        {wordsAtCell.map((w) => w.id).join(",")}
                      </span>
                    )}

                    {isBlockedCell ? (
                      ""
                    ) : isFixed ? (
                      <span className="text-gray-700 text-[5vw]">{cell}</span>
                    ) : (
                      <span
                        className={`text-[5vw] ${
                          userCell
                            ? currentPuzzle.solution[rowIndex][colIndex] ===
                              userCell
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
        <div className="bg-white rounded-2xl p-[2vh] shadow-sm mb-[1vh]">
          <div className="grid grid-cols-6 gap-[1vw] mb-[2vh]">
            {availableLetters.map((letter, index) => {
              const isUsed = usedLetters.has(index);
              const canSelect =
                selectedCell &&
                (currentPuzzle.grid[selectedCell.row][selectedCell.col] ===
                  "" ||
                  currentPuzzle.grid[selectedCell.row][selectedCell.col] ===
                    "?");

              return (
                <div key={index} className="aspect-square">
                  <button
                    onClick={() => handleLetterSelect(letter, index)}
                    disabled={!canSelect || isUsed}
                    className={`w-full h-full rounded-lg font-bold text-[5vw] transition-all duration-300 ease-in-out transform ${
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
        {selectedWords.length > 0 && (
          <div className="bg-purple-50 rounded-xl p-[2vh] mb-[1vh] border-2 border-purple-200">
            {selectedWords.length > 1 && (
              <div className="flex gap-[1vw] mb-[2vh]">
                {selectedWords.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => {
                      setSelectedDirection(word.direction);
                      setShowHint(false);
                    }}
                    className={`flex-1 py-[1.5vh] rounded-lg font-semibold text-[4vw] transition-all ${
                      selectedDirection === word.direction
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-purple-100"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>
                        {word.direction === "horizontal" ? "가로" : "세로"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const currentWord = selectedWords.find(
                (w) => w.direction === selectedDirection
              );
              if (!currentWord) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-[1vh]">
                    <div className="flex items-center gap-2">
                      <span className="text-[3vw] font-bold text-purple-600 bg-purple-200 rounded-full w-[5vw] h-[5vw] flex items-center justify-center">
                        {currentWord.id}
                      </span>
                      <span className="text-[3.5vw] font-semibold text-gray-700">
                        {currentWord.direction === "horizontal"
                          ? "가로"
                          : "세로"}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="px-[2vw] py-[1vh] bg-purple-500 text-white rounded-lg text-[3.5vw] font-semibold hover:bg-purple-600 transition-colors"
                    >
                      {showHint ? "힌트 숨기기" : "💡 힌트 보기"}
                    </button>
                  </div>

                  {showHint && (
                    <div className="p-[1.5vh] bg-white rounded-lg border border-purple-200">
                      <p className="text-[3.5vw] text-gray-600 mb-[0.5vh]">
                        💬 힌트
                      </p>
                      <p className="text-[4vw] text-gray-700">
                        {currentWord.hint}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="space-y-[1.5vh]">
          <div className="flex flex-row gap-[2vw] justify-center">
            <button
              onClick={handleLetterDelete}
              disabled={
                !selectedCell ||
                (selectedCell &&
                  currentPuzzle.grid[selectedCell.row][selectedCell.col] !==
                    "" &&
                  currentPuzzle.grid[selectedCell.row][selectedCell.col] !==
                    "?")
              }
              className={`w-full py-[2vh] text-[4vw] rounded-xl font-semibold transition-colors ${
                selectedCell &&
                (currentPuzzle.grid[selectedCell.row][selectedCell.col] ===
                  "" ||
                  currentPuzzle.grid[selectedCell.row][selectedCell.col] ===
                    "?")
                  ? "bg-red-400 text-white hover:bg-red-500"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              🗑️ 지우기
            </button>

            <button
              onClick={undo}
              disabled={history.length === 0}
              className={`w-full py-[2vh] text-[4vw] rounded-xl font-semibold transition-colors ${
                history.length > 0
                  ? "border-red-400 border-2 text-black hover:bg-red-400 hover:text-white"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              ↩️ 실행 취소
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full mx-auto py-[2vh] text-[4.5vw] rounded-xl font-semibold transition-colors bg-purple-400 text-white hover:bg-purple-500 block"
          >
            🔄 전체 초기화
          </button>
        </div>
      </div>

      <div className="mt-[5vh]" />
    </div>
  );
}
