// arithmetic/ArithmeticPage.tsx
"use client";

import React, { Suspense } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useArithmeticGame } from "./useArithmeticGame";
import { DIFFICULTY_CONFIGS } from "./utils";
import type { Difficulty } from "./types";

export default function ArithmeticPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ArithmeticGame />
    </Suspense>
  );
}

function ArithmeticGame() {
  const {
    showDifficultySelect,
    setShowDifficultySelect,
    selectedDifficulty,
    setSelectedDifficulty,
    difficulty,
    currentQuestion,
    score,
    currentQuestionNumber,
    showResult,
    selectedAnswer,
    gameCompleted,
    inCorrectCount,
    completedGames,
    MAX_QUESTIONS,
    startGameWithDifficulty,
    handleAnswerSelect,
    handleEndGame,
  } = useArithmeticGame();

  // 난이도 선택 화면
  if (showDifficultySelect) {
    return (
      <div
        className="min-h-screen safe-area-inset"
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
          .safe-area-inset {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>

        <div className="w-full px-[4vw] py-[3vh] pb-[6vh]">
          <div className="bg-white rounded-3xl p-[4vh] shadow-lg border-0">
            <div className="text-center mb-[4vh]">
              <div className="w-[20vw] h-[20vw] max-w-[100px] max-h-[100px] bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl mx-auto mb-[3vh] flex items-center justify-center shadow-lg">
                <div className="text-white text-[10vw]">🧮</div>
              </div>
              <h1 className="text-[7vw] font-bold text-gray-900 mb-[1.5vh]">
                사칙연산 게임
              </h1>
              <p className="text-gray-500 text-[4vw]">
                빠르게 계산하고 정답을 맞춰보세요!
              </p>
            </div>

            <div className="mt-[2vh]">
              <div className="space-y-[2vh]">
                {(
                  Object.entries(DIFFICULTY_CONFIGS) as [
                    Difficulty,
                    (typeof DIFFICULTY_CONFIGS)[Difficulty]
                  ][]
                ).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={`w-full p-[3vh] rounded-2xl transition-all active:scale-[0.98] ${
                      selectedDifficulty === key
                        ? "bg-gradient-to-br from-blue-400 to-blue-500 border-0 shadow-lg"
                        : completedGames[config.localIndex]
                        ? "bg-gray-50 border-2 border-green-400"
                        : "bg-white border-2 border-gray-200 shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-[1.5vw] mb-[0.5vh]">
                          {completedGames[config.localIndex] && (
                            <span className="text-[4vw]">✅</span>
                          )}
                          <div
                            className={`font-bold text-[5.5vw] ${
                              selectedDifficulty === key
                                ? "text-white"
                                : completedGames[config.localIndex]
                                ? "text-green-600"
                                : "text-gray-900"
                            }`}
                          >
                            {config.name}
                          </div>
                        </div>
                        <div
                          className={`text-[4.5vw] ${
                            selectedDifficulty === key
                              ? "text-white/90"
                              : completedGames[config.localIndex]
                              ? "text-green-600/80"
                              : "text-gray-600"
                          }`}
                        >
                          {completedGames[config.localIndex] ? (
                            <span>완료됨</span>
                          ) : (
                            config.description
                          )}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-[1vw] px-[2vw] py-[1vh] rounded-xl ${
                          selectedDifficulty === key
                            ? "bg-white/20"
                            : "bg-orange-50"
                        }`}
                      >
                        <span className="text-[4vw]">🪙</span>
                        <span
                          className={`font-bold text-[4vw] ${
                            selectedDifficulty === key
                              ? "text-white"
                              : "text-orange-600"
                          }`}
                        >
                          {config.coin}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-[4vh]">
                <button
                  onClick={() =>
                    startGameWithDifficulty(selectedDifficulty as Difficulty)
                  }
                  disabled={!selectedDifficulty}
                  className={`w-full py-[3.5vh] rounded-2xl font-bold text-[4vw] transition-all active:scale-[0.98] shadow-lg ${
                    selectedDifficulty
                      ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-blue-400/50"
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
        className="min-h-screen flex items-center justify-center p-[4vw] safe-area-inset"
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
          .safe-area-inset {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>
        <div className="bg-white p-[5vh] rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="text-[15vw] mb-[3vh] animate-bounce">🎉</div>
          <h2 className="text-[6vw] font-bold text-gray-900 mb-[2vh]">완료!</h2>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-[3vh] mb-[3vh]">
            <div className="flex justify-between items-center mb-[2vh]">
              <span className="text-[3vw] text-gray-600">틀린 문제</span>
              <span className="text-[4vw] font-bold text-gray-900">
                {inCorrectCount}개
              </span>
            </div>
            <div className="border-t border-gray-200 pt-[2vh]">
              <p className="text-[3vw] text-gray-600 mb-[1vh]">정답률</p>
              <p className="text-[7vw] font-bold text-blue-600">
                {Math.round(
                  (score / (MAX_QUESTIONS + inCorrectCount || 1)) * 100
                )}
                %
              </p>
            </div>
          </div>

          <div className="space-y-[2vh]">
            {/* 코인 받기 버튼들 */}
            <div className="flex gap-[2vw]">
              <button
                className="flex-1 py-[2.5vh] border-2 border-blue-400 text-blue-400 rounded-2xl font-bold text-[3.5vw] active:scale-[0.98] transition-all bg-white"
                onClick={() =>
                  handleEndGame(
                    "noAds",
                    DIFFICULTY_CONFIGS[difficulty].coin,
                    DIFFICULTY_CONFIGS[difficulty].backendIndex
                  )
                }
              >
                {completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex] ? (
                  <span className="text-[3vw]">코인 수령 완료</span>
                ) : (
                  <span>
                    🪙 {DIFFICULTY_CONFIGS[difficulty].coin} 코인 받기
                  </span>
                )}
              </button>
              {!completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex] && (
                <button
                  className="flex-1 py-[2.5vh] bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl font-bold text-[3.5vw] active:scale-[0.98] transition-all shadow-lg"
                  onClick={() =>
                    handleEndGame(
                      "ads",
                      DIFFICULTY_CONFIGS[difficulty].coin,
                      DIFFICULTY_CONFIGS[difficulty].backendIndex
                    )
                  }
                >
                  <span>광고보고</span>
                  <br />
                  <span className="text-[2.5vw]">2배 받기</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full py-[3.5vh] text-[4vw] bg-gradient-to-r from-blue-300 to-blue-400 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-md"
            >
              다른 난이도 선택
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div className="bg-[#F5F1E8]">
      <div className="w-full h-[2vh]"></div>
      <div className="min-h-screen p-[4vw] safe-area-inset">
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
            -webkit-tap-highlight-color: transparent;
          }
          .safe-area-inset {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>

        <div className="w-full max-w-2xl mx-auto">
          {/* 진행 상황 */}
          <div className="mb-[3vh] bg-white/95 backdrop-blur-md border-2 border-blue-200/60 rounded-2xl p-[3vh] shadow-lg">
            <div className="flex justify-between items-center mb-[1.5vh]">
              <span className="text-black font-semibold text-[4.5vw]">
                정답
              </span>
              <span className="text-blue-600 font-bold text-[5.5vw]">
                {score} / {MAX_QUESTIONS}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-[1.5vh]">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-500 h-[1.5vh] rounded-full transition-all duration-300"
                style={{
                  width: `${(score / MAX_QUESTIONS) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 문제 */}
          {currentQuestion && (
            <div className="bg-white rounded-3xl p-[5vh] shadow-lg mb-[3vh]">
              <div className="text-center mb-[5vh]">
                <div className="text-[12vw] font-bold text-gray-800 mb-[2vh]">
                  {currentQuestion.text} = ?
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[2vh]">
                {currentQuestion.choices.map((choice, index) => {
                  const isSelected = selectedAnswer === choice;
                  const isCorrect = choice === currentQuestion.answer;
                  const showCorrectAnswer = showResult && isCorrect;
                  const showWrongAnswer =
                    showResult && isSelected && !isCorrect;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(choice)}
                      disabled={showResult}
                      className={`px-[6vh] py-[4vh] rounded-2xl text-[10vw] font-bold transition-all active:scale-[0.95] flex flex-col items-center justify-center ${
                        showCorrectAnswer
                          ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg"
                          : showWrongAnswer
                          ? "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-md"
                      } ${showResult ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {(showCorrectAnswer || showWrongAnswer) && (
                        <span className="text-[6vw] mb-[1vh]">
                          {showCorrectAnswer ? "✓" : "✗"}
                        </span>
                      )}
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
