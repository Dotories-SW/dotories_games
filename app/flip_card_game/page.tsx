// flip-card/FlipCardPage.tsx
"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useFlipCardGame } from "./useFlipCardGame";
import { DIFFICULTY_CONFIGS } from "./utils";
import type { Difficulty } from "./types";

export default function FlipCardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FlipCardGame />
    </Suspense>
  );
}

function FlipCardGame() {
  const {
    showDifficultySelect,
    setShowDifficultySelect,
    selectedDifficulty,
    setSelectedDifficulty,
    gameCards,
    gameCompleted,
    showPrepareModal,
    showingCards,
    countdown,
    moveCount,
    completedGames,
    backImage,
    startGameWithDifficulty,
    handleCardClick,
    isCardFlipped,
    handleEndGame,
  } = useFlipCardGame();

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
              <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-red-400 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
                <div className="text-white text-[7vw]">🎴</div>
              </div>
              <h1 className="text-[6vw] font-bold text-gray-800 mb-[1vh]">
                카드 뒤집기 게임
              </h1>
              <p className="text-gray-600 text-[3.5vw] mb-[0.5vh]">
                같은 그림을 찾아서
              </p>
              <p className="text-gray-600 text-[3.5vw]">카드를 매칭해보세요!</p>
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
                        ? "bg-red-400 border-2 border-red-400"
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
                            : completedGames[config.localIndex]
                            ? "text-[#6ead79]"
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
                          `${config.pairs}쌍 (${config.cards}장)`
                        )}
                      </div>
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
                        {config.coin}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-[3vh]">
                <button
                  onClick={() =>
                    startGameWithDifficulty(selectedDifficulty as Difficulty)
                  }
                  className={`w-[90%] mx-auto block py-[2vh] rounded-full font-bold text-[3.5vw] transition-colors shadow-lg ${
                    selectedDifficulty
                      ? "bg-red-400 text-white hover:bg-red-500"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!selectedDifficulty}
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
            모든 카드를 매칭했습니다!
          </p>
          <p className="text-[3vw] mb-[3vh] text-gray-600">
            시도 횟수 : {moveCount}
          </p>
          <div className="space-y-[1.5vh]">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors font-semibold"
            >
              다른 난이도 선택
            </button>
            <div className="flex flex-row justify-between">
              <button
                className="w-full mr-[1vw] py-[2vh] border border-red-400 text-black rounded-xl font-bold text-[4vw] hover:bg-red-500 transition-colors mt-[1vh] hover:text-white"
                onClick={() =>
                  handleEndGame(
                    "noAds",
                    DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin,
                    DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].backendIndex
                  )
                }
              >
                {completedGames[
                  DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty]
                    .localIndex
                ] ? (
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
              {!completedGames[
                DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex
              ] && (
                <button
                  className="w-full ml-[1vw] py-[2vh] border border-red-400 text-black rounded-xl font-bold text-[4vw] hover:bg-red-500 transition-colors mt-[1vh] hover:text-white"
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

  return (
    <div
      className="h-screen overflow-hidden p-[2vh] relative"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          overflow: hidden;
        }
        .flip-card {
          perspective: 1000px;
          position: relative;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* 안내 모달 */}
      {showPrepareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[4vh] mx-[2vw] w-[80%] max-w-md text-center shadow-2xl animate-pulse">
            <div className="text-[10vw] mb-[2vh]">🎴</div>
            <p className="text-[3.5vw] text-gray-600 mb-[1vh]">
              먼저 카드를 보고
            </p>
            <p className="text-[3.5vw] text-gray-600">위치를 기억하세요!</p>
          </div>
        </div>
      )}

      {/* 카운트다운 */}
      {showingCards && countdown > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-[20vw] font-bold text-red-400 opacity-80 animate-bounce drop-shadow-2xl">
            {countdown}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto flex justify-center items-center h-full">
        <div
          className={`grid gap-[1vw]`}
          style={{
            gridTemplateColumns: `repeat(${gameCards.length / 2}, 1fr)`,
            maxWidth: `min(90vw, ${
              gameCards.length === 8
                ? "500px"
                : gameCards.length === 16
                ? "600px"
                : "500px"
            })`,
            width: "100%",
          }}
        >
          {gameCards.map((card) => (
            <div
              key={card.id}
              className={`flip-card ${
                isCardFlipped(card.id) ? "flipped" : ""
              } cursor-pointer`}
              style={{ aspectRatio: "1 / 1.51" }}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="flip-card-inner">
                {/* 앞면: 공통 뒷면 이미지 */}
                <div className="flip-card-front">
                  <Image
                    src={backImage}
                    alt="back"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flip-card-back bg-white">
                  <Image
                    fill
                    src={card.src}
                    alt={card.name}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
