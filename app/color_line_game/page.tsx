// app/...(원하시는 위치)/ColorLineGame.tsx
"use client";

import React from "react";
import { useColorLineGame } from "./useColorLineGame";
import { getColorStyle } from "./utils";

function ColorLineGame() {
  const {
    LEVEL_CONFIGS,
    showLevelSelect,
    selectedLevel,
    loading,
    gameCompleted,
    completionTime,
    currentPuzzle,
    puzzleData,
    gameGrid,
    completedColors,
    currentTime,
    selectLevel,
    startGame,
    setShowLevelSelect,
    handleStart,
    handleMove,
    handleTouchMove,
    handleEnd,
    resetGame,
  } = useColorLineGame();

  // 1) 레벨 선택 화면
  if (showLevelSelect) {
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

        <div className="max-w-md mx-auto p-4">
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-red-500 rounded-sm" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                선 연결 게임
              </h1>
              <p className="text-gray-600 text-sm mb-1">
                같은 색깔의 점을 연결하고
              </p>
              <p className="text-gray-600 text-sm">
                모든 칸을 채우는 게임입니다!
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
                레벨 선택
              </h2>
              <div className="space-y-3">
                {LEVEL_CONFIGS.map((config) => (
                  <button
                    key={config.level}
                    onClick={() => selectLevel(config.level)}
                    className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                      selectedLevel === config.level
                        ? "bg-teal-500 text-white border-teal-500 shadow-lg"
                        : "bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{config.name}</div>
                        <div
                          className={`text-sm ${
                            selectedLevel === config.level
                              ? "text-white opacity-90"
                              : "text-gray-600"
                          }`}
                        >
                          {config.size}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`${
                            selectedLevel === config.level
                              ? "text-yellow-300"
                              : "text-yellow-500"
                          } mr-1`}
                        >
                          🪙
                        </span>
                        <span className="font-semibold">{config.coin}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={startGame}
                  className="w-[90%] mx-auto block text-white py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                  style={{ backgroundColor: "#FF6B47" }}
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

  // 2) 게임 완료 화면
  if (gameCompleted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">완료!</h2>
          <p className="text-lg mb-4 text-gray-600">
            모든 선을 연결했습니다!
          </p>
          <div className="text-xl font-semibold mb-6 text-gray-800 space-y-2">
            <p>
              완료 시간:{" "}
              <span className="text-teal-600">{completionTime}초</span>
            </p>
            <p>
              완성도: <span className="text-green-500">100%</span>
            </p>
          </div>
          <div className="space-y-[1.5vh]">
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              메인화면으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3) 로딩 화면
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">게임을 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 4) 퍼즐 로드 실패
  if (!currentPuzzle || !puzzleData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">선 연결 게임</h1>
          <p className="text-gray-600 mb-4">퍼즐을 로드할 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 5) 실제 게임 화면
  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundColor: "#F5F1E8",
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
      }}
    >
      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          touch-action: manipulation;
          overscroll-behavior: none;
        }
        .game-cell {
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
      `}</style>

      <div className="max-w-md mx-auto mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div
            className="grid gap-1 mx-auto"
            data-game-grid
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle.size}, 1fr)`,
              maxWidth: "min(100%, 400px)",
              width: "100%",
              touchAction: "none",
            }}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
          >
            {gameGrid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="game-cell aspect-square border border-gray-200 cursor-pointer transition-all duration-150 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor:
                      cell.type === "empty"
                        ? "#f8f9fa"
                        : cell.color
                        ? getColorStyle(cell.color)
                        : "#f8f9fa",
                  }}
                  onMouseDown={() => handleStart(rowIndex, colIndex)}
                  onMouseEnter={() => handleMove(rowIndex, colIndex)}
                  onMouseUp={handleEnd}
                  onDragStart={(e) => e.preventDefault()}
                  onTouchStart={() => handleStart(rowIndex, colIndex)}
                  onTouchEnd={handleEnd}
                >
                  {cell.type === "dot" && cell.color && (
                    <div
                      className="w-6 h-6 rounded-full border-2 shadow-lg"
                      style={{
                        backgroundColor: completedColors.has(cell.color)
                          ? "#111827"
                          : "#ffffff",
                        borderColor: "#111827",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 하단 컨트롤 + 시간 표시 등 필요하면 추가 */}
        <div className="text-center space-y-2">
          <p className="text-gray-600">⏱ {currentTime}초</p>
          <button
            onClick={resetGame}
            className="bg-white text-gray-700 px-8 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-shadow"
          >
            🔄 다시하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ColorLineGame;
