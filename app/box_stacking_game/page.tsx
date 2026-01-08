// box-stacking/BoxStackingGame.tsx
"use client";

import React, { Suspense } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useBoxStackingGame } from "./useBoxStackingGame";
import { getBoxSpeed } from "./utils";

export default function BoxStackingGame() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BoxStackingPage />
    </Suspense>
  );
}

function BoxStackingPage() {
  const {
    canvasRef,
    gameStarted,
    gameOver,
    score,
    isEnding,
    isCompleted,
    isResetting,
    handleClick,
    handleStartGame,
    handleRetry,
    handleEndGame,
    goBack,
  } = useBoxStackingGame();

  // 종료 중 또는 정리 중 화면
  if (isEnding) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 z-[1000]">
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            overflow: hidden;
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
        <div className="bg-white rounded-3xl p-[5vh] w-[90%] max-w-md shadow-2xl text-center">
          <div
            className="mb-[3vh] animate-pulse"
            style={{ fontSize: "clamp(48px, 12vw, 56px)" }}
          >
            ⏳
          </div>
          <h2
            className="font-bold text-gray-800 mb-[2vh]"
            style={{ fontSize: "clamp(20px, 5vw, 24px)" }}
          >
            {gameOver ? "게임을 정리하는 중이에요" : "오늘의 도전을 종료하는 중이에요"}
          </h2>
          <p
            className="text-gray-600"
            style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}
          >
            잠시만 기다려 주세요...
          </p>
        </div>
      </div>
    );
  }

  // 시작 화면
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
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
        <div className="w-full px-[4vw] py-[3vh] pb-[6vh] ">
          <div className="bg-white rounded-3xl p-[4vh] shadow-lg border-0 text-center">
            <div className="w-[20vw] h-[20vw] max-w-[100px] max-h-[100px] bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl mx-auto mb-[3vh] flex items-center justify-center shadow-lg">
              <div
                className="text-white"
                style={{ fontSize: "clamp(40px, 10vw, 48px)" }}
              >
                📦
              </div>
            </div>

            <h1
              className="font-bold text-gray-800 mb-[2vh]"
              style={{ fontSize: "clamp(28px, 7vw, 32px)" }}
            >
              상자 쌓기 게임
            </h1>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-[3vh] mb-[4vh]">
              <p
                className="text-gray-700 mb-[1vh]"
                style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
              >
                상자를 최대한 많이 쌓으세요!
              </p>
              <p
                className="text-gray-700"
                style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
              >
                화면을 클릭하면 <br /> 상자가 떨어집니다.
              </p>
              <p
                className="text-red-700 mt-4"
                style={{ fontSize: "clamp(12px, 4vw, 14px)" }}
              >
                * 혹시, 박스가 흔들린다면 조금 기다린 다음, 다시 쌓아주세요.
              </p>
            </div>

            {isCompleted && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-[2vh] mb-[3vh]">
                <span
                  className="text-yellow-700"
                  style={{ fontSize: "clamp(12px, 3vw, 16px)" }}
                >
                  이미 클리어하여 코인은 지급되지 않습니다.
                </span>
              </div>
            )}

            <button
              onClick={handleStartGame}
              className="w-full py-[3.5vh] bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg"
              style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
            >
              게임 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 실제 게임 화면
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer">
      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* 점수 */}
      <div className="absolute top-[calc(2vh)] right-[4vw] z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border-2 border-blue-200/60 rounded-full px-[4vw] py-[1vh] shadow-lg">
          <div className="flex flex-row text-center items-center">
            <div
              className="font-semibold text-gray-500"
              style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}
            >
              Score
            </div>
            <div
              className="font-bold text-blue-600 ml-2"
              style={{ fontSize: "clamp(22px, 5.5vw, 26px)" }}
            >
              {score}
            </div>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer touch-none"
        style={{ display: gameOver ? 'none' : 'block' }}
        onClick={handleClick}
        onTouchEnd={(e) => {
          e.preventDefault(); // 화면 튕김 방지
          handleClick();
        }}
      />

      {/* 게임 오버 모달 */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[5vh] w-[90%] max-w-md shadow-2xl text-center mx-[4vw]">
            <div
              className="mb-[3vh] animate-bounce"
              style={{ fontSize: "clamp(60px, 15vw, 72px)" }}
            >
              💥
            </div>
            <h2
              className="font-bold text-gray-800 mb-[2vh]"
              style={{ fontSize: "clamp(24px, 6vw, 28px)" }}
            >
              게임 오버!
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-[3vh] mb-[4vh]">
              <p
                className="text-gray-600 mb-[1vh]"
                style={{ fontSize: "clamp(12px, 3vw, 16px)" }}
              >
                최종 점수
              </p>
              <p
                className="font-bold text-blue-600"
                style={{ fontSize: "clamp(28px, 7vw, 32px)" }}
              >
                {score}점
              </p>
            </div>

            <div className="space-y-[2vh]">
              <button
                onClick={handleRetry}
                disabled={isResetting}
                className={`w-full py-[3.5vh] rounded-2xl font-bold transition-all shadow-lg ${
                  isResetting 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-500 to-blue-600 active:scale-[0.98]"
                } text-white`}
                style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
              >
                {isResetting ? "게임을 정리하는 중이에요..." : "다시 하기"}
              </button>

              {score >= 70 && (
                <div className="flex gap-[2vw]">
                  <button
                    className="flex-1 py-[2.5vh] border-2 border-blue-400 text-blue-400 rounded-2xl font-bold active:scale-[0.98] transition-all bg-white"
                    style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}
                    onClick={() => {
                      if (isCompleted) {
                        goBack();
                        return;
                      }
                      handleEndGame("noAds", 3);
                    }}
                  >
                    {isCompleted ? (
                      <span style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
                        코인 수령 완료
                      </span>
                    ) : (
                      <span>
                        🪙{" "}
                        {score < 70
                          ? 0
                          : Math.min(
                              25,
                              10 + Math.floor((score - 70) / 10)
                            )}{" "}
                        코인 받기
                      </span>
                    )}
                  </button>
                  {!isCompleted && (
                    <button
                      className="flex-1 py-[2.5vh] bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-lg"
                      style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}
                      onClick={() => handleEndGame("ads", 3)}
                    >
                      <span>광고보고</span>
                      <br />
                      <span style={{ fontSize: "clamp(10px, 2.5vw, 14px)" }}>
                        2배 받기
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
