"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Difficulty, OxQuestion } from "./types";
import { pickRandomQuestion } from "./utils";
import easyData from "@/public/game_json/ox_quiz/easy.json";
import normalData from "@/public/game_json/ox_quiz/normal.json";
import hardData from "@/public/game_json/ox_quiz/hard.json";

const questionsByDifficulty: Record<Difficulty, OxQuestion[]> = {
  easy: easyData.questions as OxQuestion[],
  normal: normalData.questions as OxQuestion[],
  hard: hardData.questions as OxQuestion[],
};

type Screen = "difficulty" | "playing" | "correct";

export function useOxQuiz() {
  const [screen, setScreen] = useState<Screen>("difficulty");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<OxQuestion | null>(null);
  const [showWrongToast, setShowWrongToast] = useState(false);

  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    wrongSoundRef.current = new Audio("/sounds/ox_quiz/wrong.mp3");
    correctSoundRef.current = new Audio("/sounds/ox_quiz/correct.mp3");
    return () => {
      wrongSoundRef.current = null;
      correctSoundRef.current = null;
    };
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    const questions = questionsByDifficulty[diff];
    const question = pickRandomQuestion(questions);
    setDifficulty(diff);
    setCurrentQuestion(question);
    setShowWrongToast(false);
    setScreen("playing");
  }, []);

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (!currentQuestion) return;

      if (answer === currentQuestion.answer) {
        if (correctSoundRef.current) correctSoundRef.current.currentTime = 0;
        correctSoundRef.current?.play().catch(() => {});
        setScreen("correct");
      } else {
        if (wrongSoundRef.current) wrongSoundRef.current.currentTime = 0;
        wrongSoundRef.current?.play().catch(() => {});

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setShowWrongToast(true);
        toastTimerRef.current = setTimeout(() => {
          setShowWrongToast(false);
        }, 2000);
      }
    },
    [currentQuestion]
  );

  const goToDifficulty = useCallback(() => {
    setScreen("difficulty");
    setDifficulty(null);
    setSelectedDifficulty(null);
    setCurrentQuestion(null);
    setShowWrongToast(false);
  }, []);

  return {
    screen,
    selectedDifficulty,
    setSelectedDifficulty,
    difficulty,
    currentQuestion,
    showWrongToast,
    startGame,
    handleAnswer,
    goToDifficulty,
  };
}
