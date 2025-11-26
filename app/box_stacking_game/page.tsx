// box-stacking/BoxStackingGame.tsx
"use client";

import React, { Suspense } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useBoxStackingGame } from "./useBoxStackingGame";

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
    handleClick,
    handleStartGame,
    handleRetry,
    handleEndGame,
    goBack,
  } = useBoxStackingGame();

  // 종료 중 화면
  if (isEnding) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-3xl p-[4vh] w-[90%] max-w-md shadow-2xl text-center">
          <div className="text-[6vw] mb-[2vh]">⏳</div>
          <h2 className="text-[4.5vw] font-bold text-gray-800 mb-[1vh]">
            오늘의 도전을 종료하는 중이에요
          </h2>
          <p className="text-[3.5vw] text-gray-600">잠시만 기다려 주세요...</p>
        </div>
      </div>
    );
  }

  // 시작 화면
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-[2vh]">
        <div className="bg-white rounded-[3vh] shadow-2xl w-full max-w-md p-[5vh] text-center">
          <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-blue-400 rounded-lg mx-auto mb-[2vh] flex items-center justify-center">
            <div className="text-white text-[7vw]">📦</div>
          </div>

          <h1 className="text-[6vw] md:text-[32px] font-bold text-gray-800 mb-[2vh]">
            상자 쌓기 게임
          </h1>

          <div className="bg-blue-50 rounded-[2vh] p-[3vh] mb-[3vh]">
            <div className="flex items-center justify-center">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                상자를 최대한 많이 쌓으세요!
              </p>
            </div>
            <div className="flex items-center justify-center">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                화면을 클릭하면 상자가 떨어집니다.
              </p>
            </div>
          </div>

          {isCompleted && (
            <span className="text-[3.5vw] text-gray-600 mb-[2vh] block">
              이미 클리어하여 코인은 지급되지 않습니다.
            </span>
          )}

          <button
            onClick={handleStartGame}
            className="w-full py-[2vh] bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-[2vh] font-bold text-[4.5vw] md:text-[20px] hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mt-[2vh]"
          >
            게임 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 실제 게임 화면
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer">
      {/* 점수 */}
      <div className="absolute top-[2vh] right-[2vh] z-10 pointer-events-none">
        <div className="bg-white rounded-2xl py-[1.5vh] shadow-lg">
          <div className="text-center px-[7vw]">
            <div className="text-[4vw] text-gray-600 font-semibold">
              쌓은 상자
            </div>
            <div className="text-[5vw] font-bold text-blue-600">{score}</div>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer touch-none"
        onClick={handleClick}
        onTouchEnd={(e) => {
          e.preventDefault(); // 화면 튕김 방지
          handleClick();
        }}
      />

      {/* 게임 오버 모달 */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[4vh] w-[90%] max-w-md shadow-2xl text-center">
            <div className="text-[8vw] mb-[2vh]">💥</div>
            <h2 className="text-[5vw] font-bold text-gray-800 mb-[1vh]">
              게임 오버!
            </h2>
            <div className="text-[4vw] text-gray-600 mb-[3vh]">
              최종 점수: {score}개
            </div>
            <button
              onClick={handleRetry}
              className="w-full py-[2vh] bg-blue-500 text-white rounded-xl font-bold text-[4vw] hover:bg-blue-600 transition-colors"
            >
              다시 하기
            </button>

            {score < 10 && (
              <div className="flex flex-row justify-between">
                <button
                  className="w-[49%] py-[2vh] border border-blue-500 text-black rounded-xl
 font-bold text-[4vw] hover:bg-blue-600 transition-colors mt-[1vh] hover:text-white"
                  onClick={() => {
                    if (isCompleted) {
                      // 기존 로직: 이미 완료된 유저는 바로 뒤로가기
                      goBack();
                      return;
                    }
                    handleEndGame("noAds");
                  }}
                >
                  {isCompleted ? (
                    <div className="text-[3.5vw]">
                      <span>
                        오늘 코인을 수령하여 <br /> 더 받을 수 없습니다.
                      </span>
                    </div>
                  ) : (
                    <div className="text-[3.5vw]">
                      <span>{Math.max(1, score - 10)}코인 받고 </span>
                      <br />
                      <span>오늘의 도전 종료</span>
                    </div>
                  )}
                </button>
                <button
                  className="w-[49%] py-[2vh] border border-blue-500 text-black rounded-xl
 font-bold text-[4vw] hover:bg-blue-600 transition-colors mt-[1vh] hover:text-white"
                  onClick={() => handleEndGame("ads")}
                >
                  {isCompleted ? (
                    <div className="text-[3.5vw]">
                      <span>
                        오늘 코인을 수령하여 <br /> 더 받을 수 없습니다.
                      </span>
                    </div>
                  ) : (
                    <div className="text-[3.5vw]">
                      <span>광고 보고</span>
                      <br />
                      <span>코인 두배로 받기</span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
