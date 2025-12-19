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
    gameOver,
    showPrepareModal,
    showingCards,
    countdown,
    moveCount,
    completedGames,
    backImage,
    score,
    lives,
    encouragementMessage,
    startGameWithDifficulty,
    restartGame,
    handleCardClick,
    isCardFlipped,
    handleEndGame,
  } = useFlipCardGame();

  // 난이도 선택 화면
  if (showDifficultySelect) {
    return (
      <div className="min-h-screen safe-area-inset" style={{ backgroundColor: "#F5F1E8" }}>
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

        {/* 상단 헤더 */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center px-[4vw] py-[2vh]">
            <h1 className="text-[5vw] font-bold text-gray-900 flex-1 text-center">
              카드 뒤집기
            </h1>
          </div>
        </div>

        <div className="w-full px-[4vw] py-[3vh] pb-[6vh]">
          <div className="bg-white rounded-3xl p-[4vh] shadow-lg border-0">
            <div className="text-center mb-[4vh]">
              <div className="w-[20vw] h-[20vw] max-w-[100px] max-h-[100px] bg-gradient-to-br from-red-400 to-red-500 rounded-3xl mx-auto mb-[3vh] flex items-center justify-center shadow-lg">
                <div className="text-white text-[10vw]">🎴</div>
              </div>
              <h2 className="text-[5vw] font-bold text-gray-900 mb-[1.5vh]">
                난이도를 선택하세요
              </h2>
              <p className="text-gray-500 text-[3vw]">
                같은 그림을 찾아 카드를 매칭하세요
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
                        ? "bg-gradient-to-br from-red-400 to-red-500 border-0 shadow-lg"
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
                            className={`font-bold text-[4.5vw] ${
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
                          className={`text-[3.5vw] ${
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
                            `${config.pairs}쌍`
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-[1vw] px-[2vw] py-[1vh] rounded-xl ${
                        selectedDifficulty === key
                          ? "bg-white/20"
                          : "bg-orange-50"
                      }`}>
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
                  className={`w-full py-[3.5vh] rounded-2xl font-bold text-[4vw] transition-all active:scale-[0.98] shadow-lg ${
                    selectedDifficulty
                      ? "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-red-400/50"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
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

  // 게임 오버 화면
  if (gameOver) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[4vw] safe-area-inset"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-[5vh] rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="text-[15vw] mb-[3vh] animate-bounce">💔</div>
          <h2 className="text-[6vw] font-bold text-gray-900 mb-[2vh]">
            게임 오버
          </h2>
          <p className="text-[3.5vw] mb-[3vh] text-gray-600">
            하트를 모두 소진했습니다
          </p>
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-[3vh] mb-[4vh]">
            <p className="text-[3vw] text-gray-600 mb-[1vh]">최종 점수</p>
            <p className="text-[7vw] font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              {score}점
            </p>
          </div>
          <button
            onClick={restartGame}
            className="w-full py-[3.5vh] text-[4vw] bg-gradient-to-r from-red-400 to-red-500 text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            다시하기
          </button>
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
        <div className="bg-white p-[5vh] rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="text-[15vw] mb-[3vh] animate-bounce">🎉</div>
          <h2 className="text-[6vw] font-bold text-gray-900 mb-[2vh]">완료!</h2>
          <p className="text-[3.5vw] mb-[3vh] text-gray-600">
            모든 카드를 매칭했습니다
          </p>
          
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-[3vh] mb-[3vh]">
            <div className="flex justify-between items-center mb-[2vh]">
              <span className="text-[3vw] text-gray-600">시도 횟수</span>
              <span className="text-[4vw] font-bold text-gray-900">{moveCount}</span>
            </div>
            <div className="border-t border-gray-200 pt-[2vh]">
              <p className="text-[3vw] text-gray-600 mb-[1vh]">최종 점수</p>
              <p className="text-[7vw] font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {score}점
              </p>
            </div>
          </div>
          <div className="space-y-[2vh]">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full py-[3.5vh] text-[4vw] bg-gray-100 text-gray-900 rounded-2xl font-bold active:scale-[0.98] transition-all"
            >
              다른 난이도 선택
            </button>
            <div className="flex gap-[2vw]">
              <button
                className="flex-1 py-[2.5vh] border-2 border-red-400 text-red-400 rounded-2xl font-bold text-[3.5vw] active:scale-[0.98] transition-all bg-white"
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
                    🪙 {DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].coin} 코인 받기
                  </span>
                )}
              </button>
              {!completedGames[
                DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex
              ] && (
                <button
                  className="flex-1 py-[2.5vh] bg-gradient-to-r from-red-400 to-red-500 text-white rounded-2xl font-bold text-[3.5vw] active:scale-[0.98] transition-all shadow-lg"
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

  return (
    <div
      className="h-screen overflow-hidden relative safe-area-inset"
      style={{
        background: "linear-gradient(to bottom, #FFE5E5 0%, #FFF5F0 50%, #F5F1E8 100%)",
      }}
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
        .flip-card {
          perspective: 1000px;
          position: relative;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 3px solid rgba(255, 255, 255, 0.9);
          transition: all 0.2s ease;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
        .flip-card:active:not(.flipped) {
          transform: scale(0.96);
        }
        .flip-card:active:not(.flipped) .flip-card-front {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .encouragement-toast {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {/* 격려 메시지 토스트 */}
      {encouragementMessage && (
        <div className="fixed top-[calc(10vh+env(safe-area-inset-top))] left-1/2 transform -translate-x-1/2 z-[60] encouragement-toast">
          <div className="bg-gradient-to-r from-red-300 to-pink-300 text-white px-[5vw] py-[2vh] rounded-2xl shadow-2xl border-2 border-white/30">
            <p className="text-[3.5vw] font-bold text-center whitespace-nowrap">
              {encouragementMessage}
            </p>
          </div>
        </div>
      )}

      {/* 상단 헤더 - 모바일 스타일 */}
      <div className="absolute top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-200/30">
        <div className="flex items-center justify-between px-[5vw] py-[3vh] pt-[calc(3vh+env(safe-area-inset-top))]">
          {/* 하트 섹션 */}
          <div className="flex items-center gap-[1vw] border-2 bg-white shadow-sm border-red-200/60 rounded-full px-[3vw] py-[1.5vh]">
            <div className="text-[6.5vw] leading-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`mr-[0.3vw] ${i < lives ? "" : "opacity-20"}`}>
                  {i < lives ? "❤️" : "🤍"}
                </span>
              ))}
            </div>
          </div>
          
          {/* 점수 섹션 */}
          <div className="flex items-center gap-[1.5vw] border-2 bg-white shadow-sm border-red-200/60 rounded-full px-[3vw] py-[1.5vh]">
            <span className="text-[3.5vw] font-semibold text-gray-500">점수</span>
            <span className="text-[5.5vw] font-bold text-red-500">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* 안내 모달 */}
      {showPrepareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[5vh] mx-[4vw] w-[85%] max-w-md text-center shadow-2xl">
            <div className="text-[12vw] mb-[3vh] animate-bounce">🎴</div>
            <p className="text-[4vw] font-semibold text-gray-900 mb-[1vh]">
              카드를 기억하세요
            </p>
            <p className="text-[3.5vw] text-gray-600">
              잠시 후 카드가 뒤집힙니다
            </p>
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

      <div className="max-w-2xl mx-auto flex justify-center items-center h-full pt-[calc(8vh+env(safe-area-inset-top))] pb-[calc(2vh+env(safe-area-inset-bottom))] px-[4vw]">
        <div
          className={`grid w-full`}
          style={{
            gridTemplateColumns: `repeat(${
              gameCards.length / (gameCards.length / 4)
            }, 1fr)`,
            gap: gameCards.length === 8 ? "2vw" : gameCards.length === 16 ? "1.8vw" : "1.5vw",
            maxWidth: gameCards.length === 8 ? "85%" : gameCards.length === 16 ? "90%" : "85%",
            margin: "0 auto",
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
