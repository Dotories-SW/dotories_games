"use client";

import React, { Suspense } from "react";
import LoadingSpinner from "../../_component/LoadingSpinner";
import { useHiddenPicturePuzzle } from "./useHiddenPicturePuzzle";
import { HIT_RADIUS } from "./utils";

export default function HiddenPicturePuzzlePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HiddenPicturePuzzle />
    </Suspense>
  );
}

function HiddenPicturePuzzle() {
  const {
    gameStarted,
    gameCompleted,
    currentPuzzle,
    foundItemIds,
    foundCircles,
    missMarkers,
    missCount,
    imageLoaded,
    setImageLoaded,
    imageRef,
    startGame,
    handleImagePointerDown,
    restartGame,
  } = useHiddenPicturePuzzle();

  // ─── 시작 화면 ───────────────────────────────────────────────────
  if (!gameStarted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5F1E8" }}>
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>

        <div className="w-full px-[4vw] py-[3vh] pb-[6vh]">
          <div className="bg-white rounded-3xl p-[4vh] shadow-lg text-center">
            <div className="w-[20vw] h-[20vw] max-w-[100px] max-h-[100px] bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl mx-auto mb-[3vh] flex items-center justify-center shadow-lg">
              <span style={{ fontSize: "clamp(40px, 10vw, 48px)" }}>🔍</span>
            </div>

            <h1
              className="font-bold text-gray-800 mb-[2vh]"
              style={{ fontSize: "clamp(28px, 7vw, 32px)" }}
            >
              숨은 그림 찾기
            </h1>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-[3vh] mb-[4vh]">
              <p className="text-gray-700 mb-[1vh]" style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>
                그림 속에 숨어있는 사물을
              </p>
              <p className="text-gray-700" style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>
                모두 찾아보세요!
              </p>
            </div>

            <button
              onClick={() => startGame()}
              className="w-full py-[3.5vh] bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg"
              style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
            >
              게임 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 완료 화면 ───────────────────────────────────────────────────
  if (gameCompleted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[4vw]"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-[5vh] rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="mb-[3vh] animate-bounce" style={{ fontSize: "clamp(60px, 15vw, 72px)" }}>
            🎉
          </div>
          <h2
            className="font-bold text-gray-900 mb-[3vh]"
            style={{ fontSize: "clamp(24px, 6vw, 28px)" }}
          >
            모두 찾았어요!
          </h2>

          <button
            className="w-full py-[3.5vh] bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-lg"
            style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
            onClick={restartGame}
          >
            다시하기
          </button>
        </div>
      </div>
    );
  }

  // ─── 게임 플레이 화면 ────────────────────────────────────────────
  const totalItems = currentPuzzle?.items.length ?? 0;
  const foundCount = foundItemIds.length;

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <style jsx global>{`
        body {
          margin: 0;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes circleAppear {
          0%   { transform: translate(-50%, -50%) scale(0);    opacity: 0; }
          55%  { transform: translate(-50%, -50%) scale(1.25); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }

        @keyframes missFade {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1);   }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
        }

        .found-circle {
          animation: circleAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .miss-marker {
          animation: missFade 0.9s ease-out forwards;
        }
      `}</style>

      {/* 상단 헤더 */}
      <div
        className="flex items-center justify-end px-[4vw] border-b border-gray-200/40"
        style={{ height: "9vh", flexShrink: 0, backgroundColor: "#F5F1E8" }}
      >
        <div className="flex items-center gap-[3vw]">
          {missCount > 0 && (
            <span className="text-red-400 font-semibold" style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}>
              ✕{missCount}
            </span>
          )}
<div className="flex items-center gap-[1.5vw] bg-white border-2 border-emerald-300 rounded-full px-[3vw] py-[0.8vh]">
            <span className="text-emerald-600 font-bold" style={{ fontSize: "clamp(15px, 3.8vw, 19px)" }}>
              {foundCount}
            </span>
            <span className="text-gray-400" style={{ fontSize: "clamp(13px, 3.3vw, 17px)" }}>
              / {totalItems}
            </span>
          </div>
        </div>
      </div>

      {/* 이미지 영역 */}
      <div
        style={{
          flex: "1 1 0",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3vh 2vw 0",
        }}
      >
        <div style={{ position: "relative", maxHeight: "100%", lineHeight: 0 }}>
          {/* 이미지 로딩 중 스피너 */}
          {!imageLoaded && (
            <div
              style={{
                width: "calc(100vw - 4vw)",
                maxWidth: "calc(100vw - 4vw)",
                height: "calc(100vh - 9vh - 19vh - 2vh)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid #d1fae5",
                  borderTopColor: "#22c55e",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={currentPuzzle?.image}
            alt="숨은 그림 찾기 퍼즐"
            style={{
              display: imageLoaded ? "block" : "none",
              maxHeight: "calc(100vh - 9vh - 19vh - 2vh)",
              maxWidth: "calc(100vw - 4vw)",
              width: "auto",
              height: "auto",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              cursor: "crosshair",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onLoad={() => setImageLoaded(true)}
            onPointerDown={handleImagePointerDown}
            draggable={false}
          />

          {/* 찾은 동그라미 + 미스 마커 오버레이 */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {foundCircles.map((circle) => (
              <div
                key={circle.itemId}
                className="found-circle"
                style={{
                  position: "absolute",
                  left: `${circle.x * 100}%`,
                  top: `${circle.y * 100}%`,
                  width: `${HIT_RADIUS * 2.3 * 100}%`,
                  aspectRatio: "1",
                  borderRadius: "50%",
                  border: "3px solid #22c55e",
                  backgroundColor: "rgba(34, 197, 94, 0.22)",
                  boxShadow: "0 0 0 2px rgba(34,197,94,0.4)",
                }}
              />
            ))}

            {missMarkers.map((marker) => (
              <div
                key={marker.id}
                className="miss-marker"
                style={{
                  position: "absolute",
                  left: `${marker.x * 100}%`,
                  top: `${marker.y * 100}%`,
                  color: "#ef4444",
                  fontSize: "clamp(18px, 4.5vw, 22px)",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                ✕
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 단어 목록 */}
      <div
        style={{
          height: "19vh",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 4vw 2vh",
          backgroundColor: "#F5F1E8",
        }}
      >
        <div className="flex flex-wrap gap-[1.5vw] justify-center content-center">
          {currentPuzzle?.items.map((item) => {
            const found = foundItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                style={{
                  fontSize: "clamp(13px, 3.3vw, 17px)",
                  padding: "0.6vh 3vw",
                  borderRadius: "999px",
                  fontWeight: found ? "bold" : "500",
                  backgroundColor: found ? "#22c55e" : "white",
                  color: found ? "white" : "#374151",
                  border: found ? "2px solid #22c55e" : "2px solid #d1d5db",
                  textDecoration: found ? "line-through" : "none",
                  transition: "all 0.3s ease",
                  boxShadow: found
                    ? "0 2px 8px rgba(34,197,94,0.35)"
                    : "0 1px 3px rgba(0,0,0,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {found ? "✓ " : ""}{item.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
