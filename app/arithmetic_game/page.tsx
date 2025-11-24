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
              <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-blue-500 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
                <div className="text-white text-[7vw]">🧮</div>
              </div>
              <h1 className="text-[6vw] font-bold text-gray-800 mb-[1vh]">
                산수 게임
              </h1>
              <p className="text-gray-600 text-[3.5vw] mb-[0.5vh]">
                빠르게 계산하고
              </p>
              <p className="text-gray-600 text-[3.5vw]">정답을 맞춰보세요!</p>
            </div>

            <div className="mt-[3vh]">
              <h2 className="text-[3.5vw] font-bold text-gray-800 text-center mb-[2vh]">
                난이도 선택
              </h2>
              <div className="space-y-[1.5vh]">
                {(
                  Object.entries(DIFFICULTY_CONFIGS) as [
                    Difficulty,
                    (typeof DIFFICULTY_CONFIGS)[Difficulty]
                  ][]
                ).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={`w-full p-[2vh] rounded-2xl transition-all ${
                      selectedDifficulty === key
                        ? "bg-blue-400 border-2 border-blue-400"
                        : completedGames[config.localIndex]
                        ? "border-2 border-[#6ead79]"
                        : "bg-white border-2 border-gray-300 hover:border-gray-400"
                    } shadow-sm hover:shadow-md`}
                  >
                    <div className="text-center">
                      <div
                        className={`font-bold text-[4vw] ${
                          selectedDifficulty === key
                            ? "text-white"
                            : "text-gray-800"
                        }`}
                      >
                        {config.name}
                      </div>
                      <div
                        className={`text-[3vw] ${
                          selectedDifficulty === key
                            ? "text-white"
                            : completedGames[config.localIndex]
                            ? "text-[#6ead79]"
                            : "text-gray-600"
                        }`}
                      >
                        {completedGames[config.localIndex] ? (
                          <span className="text-[2.5vw]">
                            게임 진행은 가능하지만, 코인은 제공되지 않습니다.
                          </span>
                        ) : (
                          config.description
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-orange-600 font-semibold mt-[1vh]">
                        <span className="text-[3.5vw]">🪙</span>
                        <span
                          className={`text-[3.5vw] ${
                            selectedDifficulty === key
                              ? "text-white"
                              : "text-blue-400"
                          }`}
                        >
                          {config.coin}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-[3vh]">
                <button
                  onClick={() =>
                    startGameWithDifficulty(selectedDifficulty as Difficulty)
                  }
                  disabled={!selectedDifficulty}
                  className={`w-[90%] mx-auto block py-[2vh] rounded-full font-bold text-[3.5vw] transition-colors shadow-lg ${
                    selectedDifficulty
                      ? "bg-blue-500 text-white hover:bg-blue-600"
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
          <p className="text-[3vw] mb-[3vh] text-black-600">
            틀린 문제 : {inCorrectCount}개
          </p>
          <p className="text-[3vw] mb-[3vh] text-black-600">
            정답률 :{" "}
            <span className="text-green-600 font-bold">
              {Math.round(
                (score / (MAX_QUESTIONS + inCorrectCount || 1)) * 100
              )}
              %
            </span>
          </p>
          <div className="space-y-[1.5vh]">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
            >
              다른 난이도 선택
            </button>
            <button
              onClick={() => startGameWithDifficulty(difficulty)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              같은 난이도 다시하기
            </button>
            <div className="flex flex-row justify-between">
              <button
                className="w-full mr-[1vw] py-[2vh] border border-blue-500 text-black rounded-xl font-bold text-[4vw] hover:bg-blue-600 transition-colors mt-[1vh] hover:text-white"
                onClick={() =>
                  handleEndGame("noAds", DIFFICULTY_CONFIGS[difficulty].coin)
                }
              >
                {completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex] ? (
                  <div className="text-[3.5vw]">
                    <span>
                      오늘 코인을 수령하여 <br /> 더 받을 수 없습니다.
                    </span>
                  </div>
                ) : (
                  <span>{DIFFICULTY_CONFIGS[difficulty].coin} 코인 받기</span>
                )}
              </button>
              {!completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex] && (
                <button
                  className="w-full ml-[1vw] py-[2vh] border border-blue-500 text-black rounded-xl font-bold text-[4vw] hover:bg-blue-600 transition-colors mt-[1vh] hover:text-white"
                  onClick={() =>
                    handleEndGame("ads", DIFFICULTY_CONFIGS[difficulty].coin)
                  }
                >
                  <div className="text-[3.5vw]">
                    <span>광고 보고</span>
                    <br />
                    <span>코인 두배로 받기</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div
      className="min-h-screen p-[2vh]"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <div className="w-[90%] max-w-2xl mx-auto">
        {/* 진행 상황 */}
        <div className="mb-[3vh] bg-white rounded-2xl p-[2vh] shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold text-[3vw]">정답</span>
            <span className="text-blue-600 font-bold text-[3.5vw]">
              {score} / {MAX_QUESTIONS}
            </span>
          </div>
          <div className="mt-[1vh] bg-gray-200 rounded-full h-[1vh]">
            <div
              className="bg-blue-500 h-[1vh] rounded-full transition-all duration-300"
              style={{
                width: `${(score / MAX_QUESTIONS) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 문제 */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl p-[4vh] shadow-lg mb-[3vh]">
            <div className="text-center mb-[4vh]">
              <div className="text-[6vw] font-bold text-gray-800 mb-[2vh]">
                {currentQuestion.text} = ?
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[1.5vh]">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedAnswer === choice;
                const isCorrect = choice === currentQuestion.answer;
                const showCorrectAnswer = showResult && isCorrect;
                const showWrongAnswer = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(choice)}
                    disabled={showResult}
                    className={`p-[3vh] rounded-xl text-[5vw] font-bold transition-all ${
                      showCorrectAnswer
                        ? "bg-green-500 text-white"
                        : showWrongAnswer
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95"
                    } ${showResult ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {choice}
                    {showCorrectAnswer && " ✓"}
                    {showWrongAnswer && " ✗"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-[5vh]" />
      </div>
    </div>
  );
}
