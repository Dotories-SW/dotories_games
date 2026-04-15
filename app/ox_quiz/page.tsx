"use client";

import React, { Suspense } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useOxQuiz } from "./useOxQuiz";
import { DIFFICULTY_LABEL } from "./utils";
import type { Difficulty } from "./types";

export default function OxQuizPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OxQuiz />
    </Suspense>
  );
}

function OxQuiz() {
  const {
    screen,
    selectedDifficulty,
    setSelectedDifficulty,
    difficulty,
    currentQuestion,
    showWrongToast,
    startGame,
    handleAnswer,
    goToDifficulty,
  } = useOxQuiz();

  // ─── 난이도 선택 화면 ────────────────────────────────────────────
  if (screen === "difficulty") {
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
          <div className="bg-white rounded-3xl p-[4vh] shadow-lg">
            <div className="text-center mb-[4vh]">
              <div className="w-[20vw] h-[20vw] max-w-[100px] max-h-[100px] bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl mx-auto mb-[3vh] flex items-center justify-center shadow-lg">
                <span style={{ fontSize: "clamp(40px, 10vw, 48px)" }}>❓</span>
              </div>
              <h1
                className="font-bold text-gray-900 mb-[1.5vh]"
                style={{ fontSize: "clamp(28px, 7vw, 32px)" }}
              >
                OX 퀴즈
              </h1>
              <p className="text-gray-500" style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>
                난이도를 선택하고 정답을 맞춰보세요!
              </p>
            </div>

            <div className="space-y-[2vh]">
              {(["easy", "normal", "hard"] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`w-full p-[2vh] rounded-2xl transition-all active:scale-[0.98] ${
                    selectedDifficulty === diff
                      ? "bg-gradient-to-br from-blue-400 to-blue-500 border-0 shadow-lg"
                      : "bg-white border-2 border-gray-200 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`font-bold ${
                        selectedDifficulty === diff ? "text-white" : "text-gray-900"
                      }`}
                      style={{ fontSize: "clamp(22px, 5.5vw, 26px)" }}
                    >
                      {DIFFICULTY_LABEL[diff]}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-[4vh]">
              <button
                onClick={() => selectedDifficulty && startGame(selectedDifficulty)}
                disabled={!selectedDifficulty}
                className={`w-full py-[2vh] rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg ${
                  selectedDifficulty
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
              >
                게임 시작
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 정답 화면 ───────────────────────────────────────────────────
  if (screen === "correct") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[4vw]"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-[5vh] rounded-3xl shadow-2xl text-center w-full max-w-md">
          <div className="mb-[2vh] animate-bounce" style={{ fontSize: "clamp(56px, 14vw, 68px)" }}>
            🎉
          </div>
          <h2
            className="font-bold text-emerald-500 mb-[3vh]"
            style={{ fontSize: "clamp(28px, 7vw, 34px)" }}
          >
            정답!
          </h2>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-[3vh] mb-[4vh] text-left">
            <p className="text-gray-600 font-semibold mb-[1vh]" style={{ fontSize: "clamp(13px, 3.3vw, 16px)" }}>
              해설
            </p>
            <p className="text-gray-800" style={{ fontSize: "clamp(15px, 3.8vw, 19px)", lineHeight: 1.6 }}>
              {currentQuestion?.explanation}
            </p>
          </div>

          <button
            onClick={goToDifficulty}
            className="w-full py-[3.5vh] bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-lg"
            style={{ fontSize: "clamp(16px, 4vw, 20px)" }}
          >
            난이도 선택으로
          </button>
        </div>
      </div>
    );
  }

  // ─── 문제 풀이 화면 ──────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-[4vw]"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <style jsx global>{`
        body {
          margin: 0;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @keyframes toastIn {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* 오답 토스트 */}
      {showWrongToast && (
        <div
          style={{
            position: "fixed",
            bottom: "12vh",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#ef4444",
            color: "white",
            padding: "1.2vh 6vw",
            borderRadius: "999px",
            fontWeight: "bold",
            fontSize: "clamp(15px, 3.8vw, 19px)",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
            zIndex: 100,
            animation: "toastIn 0.25s ease-out forwards",
          }}
        >
          다시 한번 생각해 보세요!
        </div>
      )}

      <div className="w-full max-w-md">
        {/* 난이도 뱃지 */}
        {difficulty && (
          <div className="flex justify-center mb-[3vh]">
            <span
              className="bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold px-[4vw] py-[0.8vh] rounded-full"
              style={{ fontSize: "clamp(13px, 3.3vw, 16px)" }}
            >
              {DIFFICULTY_LABEL[difficulty]}
            </span>
          </div>
        )}

        {/* 문제 카드 */}
        <div className="bg-white rounded-3xl shadow-lg p-[5vh] mb-[4vh] text-center">
          <div
            className="text-gray-400 font-semibold mb-[2vh]"
            style={{ fontSize: "clamp(13px, 3.3vw, 16px)" }}
          >
            QUIZ
          </div>
          <p
            className="text-gray-900 font-bold"
            style={{ fontSize: "clamp(18px, 4.5vw, 24px)", lineHeight: 1.6 }}
          >
            {currentQuestion?.question}
          </p>
        </div>

        {/* O / X 버튼 */}
        <div className="flex gap-[4vw]">
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 bg-white rounded-3xl shadow-lg flex items-center justify-center transition-all active:scale-[0.95]"
            style={{ aspectRatio: "1", border: "3px solid #e5e7eb" }}
          >
            <span
              className="font-black text-blue-500"
              style={{ fontSize: "clamp(56px, 14vw, 80px)", lineHeight: 1 }}
            >
              O
            </span>
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 bg-white rounded-3xl shadow-lg flex items-center justify-center transition-all active:scale-[0.95]"
            style={{ aspectRatio: "1", border: "3px solid #e5e7eb" }}
          >
            <span
              className="font-black text-red-500"
              style={{ fontSize: "clamp(56px, 14vw, 80px)", lineHeight: 1 }}
            >
              X
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
