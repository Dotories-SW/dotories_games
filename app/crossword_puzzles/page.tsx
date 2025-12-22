// app/crossword_puzzles/page.tsx
"use client";

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
  } = useCrosswordGame();

  // 난이도 선택 화면
  if (showDifficultySelect) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
            -webkit-tap-highlight-color: transparent;
          }

        `}</style>

        <div className="w-full px-[4vw] py-[3vh] pb-[6vh]">
          <div className="bg-white rounded-3xl p-[4vh] shadow-lg border-0">
            <div className="text-center mb-[4vh]">
              <div className="w-[20vw] h-[20vw] max-w-[100px] max-h-[100px] bg-purple-500 rounded-3xl mx-auto mb-[3vh] flex items-center justify-center shadow-lg">
                <div className="text-white text-[10vw] font-bold">🧩</div>
              </div>
              <h1 className="text-[7vw] font-bold text-gray-900 mb-[1.5vh]">
                낱말 퀴즈
              </h1>
              <p className="text-gray-500 text-[4vw] mb-[0.5vh]">
                빈칸을 채워서
              </p>
              <p className="text-gray-500 text-[4vw]">
                단어를 완성해보세요!
              </p>
            </div>

            <div className="mt-[2vh]">
              <div className="space-y-[2vh]">
                {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(
                  (key) => {
                    const config = DIFFICULTY_CONFIGS[key];
                    const isSelected = selectedDifficulty === key;
                    const isCompleted = completedGames[config.localIndex];

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDifficulty(key)}
                        className={`w-full p-[3vh] rounded-2xl transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg"
                            : isCompleted
                            ? "bg-gray-50 border-2 border-green-400"
                            : "bg-white border-2 border-gray-200 shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-[1.5vw] mb-[0.5vh]">
                              {isCompleted && (
                                <span className="text-[4vw]">✅</span>
                              )}
                              <div
                                className={`font-bold text-[5.5vw] ${
                                  isSelected
                                    ? "text-white"
                                    : isCompleted
                                    ? "text-green-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {config.name}
                              </div>
                            </div>
                          <div
                            className={`text-[4.5vw] ${
                              isSelected
                                ? "text-white/90"
                                : isCompleted
                                ? "text-green-600/80"
                                : "text-gray-600"
                            }`}
                          >
                            {isCompleted ? <span>완료됨</span> : <span>도전 가능</span>}
                          </div>
                          </div>
                          <div
                            className={`flex items-center gap-[1vw] px-[2vw] py-[1vh] rounded-xl ${
                              isSelected ? "bg-white/20" : "bg-orange-50"
                            }`}
                          >
                            <span className="text-[4vw]">🪙</span>
                            <span
                              className={`font-bold text-[4vw] ${
                                isSelected ? "text-white" : "text-orange-600"
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

              <div className="mt-[4vh]">
                <button
                  onClick={() =>
                    selectedDifficulty &&
                    startGameWithDifficulty(selectedDifficulty)
                  }
                  className={`w-full py-[3.5vh] rounded-2xl font-bold text-[4vw] transition-all active:scale-[0.98] shadow-lg ${
                    selectedDifficulty
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-400/50"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
        className="min-h-screen flex items-center justify-center p-[4vw]"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            overflow: hidden;
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
        <div className="bg-white p-[5vh] rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="text-[15vw] mb-[3vh] animate-bounce">🎉</div>
          <h2 className="text-[6vw] font-bold text-gray-900 mb-[2vh]">완료!</h2>
          <p className="text-[3.5vw] mb-[3vh] text-gray-600">
            모든 단어를 완성했습니다!
          </p>
          <div className="space-y-[2vh]">
            <button
              onClick={goToDifficultySelect}
              className="w-full py-[3.5vh] text-[4vw] bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-md"
            >
              다른 난이도 선택
            </button>
            <button
              onClick={() => (window.location.href = "/crossword_puzzles")}
              className="w-full py-[3.5vh] text-[4vw] bg-gray-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-md"
            >
              메인화면으로
            </button>
            <div className="flex gap-[2vw]">
              <button
                className="flex-1 py-[2.5vh] border-2 border-purple-500 text-purple-500 rounded-2xl font-bold text-[3.5vw] active:scale-[0.98] transition-all bg-white"
                onClick={() =>
                  handleEndGame(
                    "noAds",
                    DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin,
                    DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty]
                      .backendIndex
                  )
                }
              >
                {completedGames[
                  DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty]
                    .localIndex
                ] ? (
                  <span className="text-[3vw]">코인 수령 완료</span>
                ) : (
                  <span>
                    🪙{" "}
                    {DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin}{" "}
                    코인 받기
                  </span>
                )}
              </button>
              {!completedGames[
                DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex
              ] && (
                <button
                  className="flex-1 py-[2.5vh] bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-2xl font-bold text-[3.5vw] active:scale-[0.98] transition-all shadow-lg"
                  onClick={() =>
                    handleEndGame(
                      "ads",
                      DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin,
                      DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty]
                        .backendIndex
                    )
                  }
                >
                  <span>광고보고</span>
                  <br />
                  <span className="text-[2.5vw]">2배 받기</span>
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
    <div className="bg-[#F5F1E8]">
      <div className="min-h-screen p-[4vw]">
      <div className="mt-[1vh]"></div>
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
            -webkit-tap-highlight-color: transparent;
          }
          .crossword-cell {
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }
        `}</style>

        <div className="w-full max-w-2xl mx-auto">
          
          {/* 프로그레스바 */}
          <div className="bg-white/95 backdrop-blur-md border-2 border-purple-200/60 rounded-2xl p-[3vh] shadow-lg mb-[2vh]">
            <div className="flex items-center justify-between mb-[1.5vh]">
              <div className="flex items-center gap-[1.5vw]">
                <span className="text-[4.5vw] font-bold text-gray-700">
                  진행률
                </span>
                <span className="text-[4vw] text-gray-500">
                  {correctCount} / {totalBlanks}
                </span>
              </div>
              <span className="text-[4.5vw] font-bold text-purple-600">
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
              className="grid gap-[0.8vw] mx-auto"
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
                      className={`crossword-cell aspect-square border-2 transition-all duration-150 rounded-lg flex items-center justify-center font-bold text-[4vw] relative ${
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
                        <span className="absolute top-[0%] left-[5%] text-[2.5vw] text-purple-600 font-semibold">
                          {wordsAtCell.map((w) => w.id).join(",")}
                        </span>
                      )}

                      {isBlockedCell ? (
                        ""
                      ) : isFixed ? (
                        <span className="text-gray-700 text-[6vw]">
                          {cell}
                        </span>
                      ) : (
                        <span
                          className={`text-[6vw] ${
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
                      className={`w-full h-full rounded-lg font-bold text-[6vw] transition-all duration-300 ease-in-out transform ${
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
                      className="px-[2vw] py-[1vh] bg-purple-500 text-white rounded-lg text-[4vw] font-semibold hover:bg-purple-600 transition-colors"
                    >
                      {showHint ? "힌트 숨기기" : "💡 힌트 보기"}
                    </button>
                  </div>

                  {showHint && (
                    <div className="p-[1.5vh] bg-white rounded-lg border border-purple-200">
                      <p className="text-[3.8vw] text-gray-600 mb-[0.5vh]">
                        💬 힌트
                      </p>
                      <p className="text-[4.5vw] text-gray-700">
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
                className={`w-full py-[2vh] text-[4.5vw] rounded-xl font-semibold transition-colors ${
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
                className={`w-full py-[2vh] text-[4.5vw] rounded-xl font-semibold transition-colors ${
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
              className="w-full mx-auto py-[2vh] text-[4.8vw] rounded-xl font-semibold transition-colors bg-purple-400 text-white hover:bg-purple-500 block"
            >
              🔄 전체 초기화
            </button>
          </div>
        </div>

        <div className="mt-[5vh]" />
      </div>
    </div>
  );
}
