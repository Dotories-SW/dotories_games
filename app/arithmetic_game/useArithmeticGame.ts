// arithmetic/useArithmeticGame.ts
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";
import { BASE_LOGIN_ID } from "../constants/constants";

import type { Difficulty, Question } from "./types";
import { DIFFICULTY_CONFIGS, MAX_QUESTIONS, generateQuestion } from "./utils";
import { useGameTimer } from "../_hooks/useGameTimer";

export function useArithmeticGame() {
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [previousAnswer, setPreviousAnswer] = useState<number | null>(null);
  const [inCorrectCount, setInCorrectCount] = useState<number>(0);

  const [completedGames, setCompletedGames] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : BASE_LOGIN_ID;
  const router = useRouter();

  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const failSoundRef = useRef<HTMLAudioElement | null>(null);
  const arithmeticSoundRef = useRef<HTMLAudioElement | null>(null);
  const { start, stopAndGetDuration, reset } = useGameTimer();

  // 사운드 초기화
  useEffect(() => {
    successSoundRef.current = new Audio("/sounds/arithmetic/success.mp3");
    failSoundRef.current = new Audio("/sounds/arithmetic/fail.mp3");
    arithmeticSoundRef.current = new Audio(
      "/sounds/arithmetic/arithmetic_bgm.mp3"
    );
    if (arithmeticSoundRef.current) {
      arithmeticSoundRef.current.loop = true;
      arithmeticSoundRef.current.volume = 0.1;
    }

    return () => {
      if (successSoundRef.current) {
        successSoundRef.current.pause();
        successSoundRef.current = null;
      }
      if (failSoundRef.current) {
        failSoundRef.current.pause();
        failSoundRef.current = null;
      }
      if (arithmeticSoundRef.current) {
        arithmeticSoundRef.current.pause();
        arithmeticSoundRef.current = null;
      }
    };
  }, []);

  // 완료 여부 가져오기 (난이도 선택 화면에서)
  useEffect(() => {
    const getCompleted = async () => {
      const res = await getGameCompleted(loginId);
      let data = res.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      setCompletedGames([
        data[DIFFICULTY_CONFIGS.easy.backendIndex],
        data[DIFFICULTY_CONFIGS.normal.backendIndex],
        data[DIFFICULTY_CONFIGS.hard.backendIndex],
      ]);
    };

    if (showDifficultySelect) {
      getCompleted();
    }
  }, [loginId, showDifficultySelect]);

  // 게임 완료 → 서버에 완료 전송 + BGM 정지
  useEffect(() => {
    arithmeticSoundRef.current?.pause();
  }, [gameCompleted]);

  const startGameWithDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setGameCompleted(false);
    setPreviousAnswer(null);
    setShowDifficultySelect(false);
    setInCorrectCount(0);
    reset();
    start();
    const question = generateQuestion(diff, null);
    setCurrentQuestion(question);
    setCurrentQuestionNumber(1);
    setShowResult(false);
    setSelectedAnswer(null);

    arithmeticSoundRef.current?.play();
  }, []);

  const nextQuestion = useCallback(
    (diff: Difficulty, prevAns: number | null, currentNum: number) => {
      if (currentNum >= MAX_QUESTIONS) {
        setGameCompleted(true);
        return;
      }

      const question = generateQuestion(diff, prevAns);
      setCurrentQuestion(question);
      setCurrentQuestionNumber(currentNum + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setPreviousAnswer(prevAns);
    },
    []
  );

  const handleAnswerSelect = useCallback(
    (answer: number) => {
      if (showResult || !currentQuestion) return;

      setSelectedAnswer(answer);
      setShowResult(true);

      const isCorrect = answer === currentQuestion.answer;
      if (isCorrect) {
        successSoundRef.current?.play();
        setScore((prev) => prev + 1);

        const nextPrevAnswer =
          difficulty === "hard" && currentQuestion
            ? currentQuestion.answer
            : previousAnswer;

        const currentNum = currentQuestionNumber;
        const newScore = score + 1;

        setTimeout(() => {
          if (newScore >= MAX_QUESTIONS) {
            setGameCompleted(true);
          } else {
            nextQuestion(difficulty, nextPrevAnswer, currentNum);
          }
        }, 1500);
      } else {
        failSoundRef.current?.play();

        setTimeout(() => {
          const newQuestion = generateQuestion(difficulty, null);
          setCurrentQuestion(newQuestion);
          setShowResult(false);
          setSelectedAnswer(null);
          setPreviousAnswer(null);
          setInCorrectCount((prev) => prev + 1);
        }, 1500);
      }
    },
    [
      currentQuestion,
      currentQuestionNumber,
      difficulty,
      nextQuestion,
      previousAnswer,
      score,
      showResult,
    ]
  );

  const handleEndGame = async (mode: string, coin: number, index: number) => {
    const playDurationSec = stopAndGetDuration();
    if (completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex]) {
      router.back();
      return;
    } else if (
      !completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex] &&
      mode === "ads"
    ) {
      window.parent.postMessage(
        {
          type: "fromApp",
          payload: { advertise: true, coin: coin * 2, index: index, durationsec: playDurationSec, score: inCorrectCount, description: "" },
        },
        "*"
      );
    } else if (
      !completedGames[DIFFICULTY_CONFIGS[difficulty].localIndex] &&
      mode === "noAds"
    ) {
      try {
        await patchCompletedGame(
          loginId,
          DIFFICULTY_CONFIGS[difficulty].backendIndex,
          true,
          coin,
          playDurationSec,
          inCorrectCount,
          ""
        );
      } catch (e) {
        console.error("patchCompletedGame error", e);
      } finally {
        router.back();
      }
    }
  };

  return {
    // 상태
    showDifficultySelect,
    setShowDifficultySelect: setShowDifficultySelect as Dispatch<
      SetStateAction<boolean>
    >,
    selectedDifficulty,
    setSelectedDifficulty: setSelectedDifficulty as Dispatch<
      SetStateAction<Difficulty | null>
    >,
    difficulty,
    currentQuestion,
    score,
    currentQuestionNumber,
    showResult,
    selectedAnswer,
    gameCompleted,
    inCorrectCount,
    completedGames,

    // 상수
    MAX_QUESTIONS,

    // 핸들러
    startGameWithDifficulty,
    handleAnswerSelect,
    handleEndGame,
  };
}
