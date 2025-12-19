// flip-card/useFlipCardGame.ts
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";
import { BASE_LOGIN_ID } from "../constants/constants";

import data from "@/public/game_json/flip_card_game/flip_card_game.json";
import type { Card, GameData, Difficulty } from "./types";
import { DIFFICULTY_CONFIGS, shuffleCards } from "./utils";
import { useGameTimer } from "../_hooks/useGameTimer";

const gameData = data as GameData;

export function useFlipCardGame() {
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [gameCards, setGameCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [showingCards, setShowingCards] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [moveCount, setMoveCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [lives, setLives] = useState<number>(5);
  const [playDurationSec, setPlayDurationSec] = useState<number | null>(null);
  const [encouragementMessage, setEncouragementMessage] = useState<string | null>(null);
  const hasStoppedTimerRef = useRef(false);
  const streakRef = useRef<number>(0);

  const [completedGames, setCompletedGames] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  const gameBgmRef = useRef<HTMLAudioElement | null>(null);
  const flipCardEffectRef = useRef<HTMLAudioElement | null>(null);

  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : BASE_LOGIN_ID;

  const router = useRouter();
  const { start, stopAndGetDuration, reset } = useGameTimer();

  // 게임 종료(완료/게임오버) 시 타이머/사운드 정리
  useEffect(() => {
    if (!gameCompleted && !gameOver) return;

    gameBgmRef.current?.pause();

    if (!hasStoppedTimerRef.current) {
      hasStoppedTimerRef.current = true;
      setPlayDurationSec(stopAndGetDuration());
    }
  }, [gameCompleted, gameOver, stopAndGetDuration]);

  // 오디오 초기화
  useEffect(() => {
    gameBgmRef.current = new Audio("/sounds/flip_card/flip_card_bgm.mp3");
    if (gameBgmRef.current) {
      gameBgmRef.current.loop = true;
      gameBgmRef.current.volume = 0.1;
    }

    flipCardEffectRef.current = new Audio(
      "/sounds/flip_card/flip_card_effect.mp3"
    );

    return () => {
      if (gameBgmRef.current) {
        gameBgmRef.current.pause();
        gameBgmRef.current = null;
      }
      flipCardEffectRef.current = null;
    };
  }, []);

  // 완료 여부 가져오기
  useEffect(() => {
    const getCompleted = async () => {
      const res = await getGameCompleted(loginId);
      let d = res.data;
      if (typeof d === "string") {
        d = JSON.parse(d);
      }
      setCompletedGames([
        d[DIFFICULTY_CONFIGS.easy.backendIndex],
        d[DIFFICULTY_CONFIGS.normal.backendIndex],
        d[DIFFICULTY_CONFIGS.hard.backendIndex],
      ]);
    };

    if (showDifficultySelect) {
      getCompleted();
    }
  }, [loginId, showDifficultySelect]);

  // 난이도별 게임 시작
  const startGameWithDifficulty = useCallback((difficulty: Difficulty) => {
    const pairCount = gameData.difficulty[difficulty];
    const selectedCards = gameData.cards.slice(0, pairCount * 2);
    const shuffled = shuffleCards(selectedCards);

    if (gameBgmRef.current) {
      gameBgmRef.current.play();
    }

    setSelectedDifficulty(difficulty);
    setGameCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
    setIsChecking(false);
    setGameCompleted(false);
    setGameOver(false);
    setShowDifficultySelect(false);
    setShowPrepareModal(true);
    setShowingCards(false);
    setCountdown(3);
    setMoveCount(0);
    setWrongAttempts(0);
    setScore(0);
    setStreak(0);
    streakRef.current = 0;
    setLives(5);
    setEncouragementMessage(null);
    setPlayDurationSec(null);
    hasStoppedTimerRef.current = false;
    reset();
    start();
  }, [reset, start]);

  // 안내 모달 → 카드 미리보기 시작
  useEffect(() => {
    if (!showPrepareModal) return;

    const timer = setTimeout(() => {
      setShowPrepareModal(false);
      setShowingCards(true);
      setCountdown(5);
    }, 1500);

    return () => clearTimeout(timer);
  }, [showPrepareModal]);

  // 카운트다운 / 미리보기 종료
  useEffect(() => {
    if (showingCards && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showingCards && countdown === 0) {
      setShowingCards(false);
    }
  }, [showingCards, countdown]);

  // 게임 완료 체크
  useEffect(() => {
    if (gameCards.length > 0 && matchedCards.length === gameCards.length) {
      const timer = setTimeout(() => {
        setGameCompleted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [matchedCards, gameCards]);

  // 목숨 0이 되면 게임오버
  useEffect(() => {
    if (gameCompleted) return;
    if (lives <= 0) {
      setGameOver(true);
      setFlippedCards([]);
      setIsChecking(false);
    }
  }, [lives, gameCompleted]);

  // 카드가 뒤집혀있는지 판단
  const isCardFlipped = useCallback(
    (cardId: number) => {
      return (
        showingCards ||
        flippedCards.includes(cardId) ||
        matchedCards.includes(cardId)
      );
    },
    [showingCards, flippedCards, matchedCards]
  );

  // 카드 클릭 처리
  const handleCardClick = useCallback(
    (cardId: number) => {
      if (
        showingCards ||
        flippedCards.includes(cardId) ||
        matchedCards.includes(cardId) ||
        isChecking ||
        flippedCards.length >= 2 ||
        gameCompleted ||
        gameOver
      ) {
        return;
      }

      flipCardEffectRef.current?.play();

      const newFlipped = [...flippedCards, cardId];
      setFlippedCards(newFlipped);

      if (newFlipped.length === 2) {
        setIsChecking(true);
        const [firstId, secondId] = newFlipped;
        const firstCard = gameCards.find((c) => c.id === firstId);
        const secondCard = gameCards.find((c) => c.id === secondId);

        if (firstCard?.name === secondCard?.name) {
          // 매칭 성공
          setMatchedCards((prev) => {
            const newMatched = [...prev, firstId, secondId];
            const matchedPairs = newMatched.length / 2;
            
            // 난이도별 격려 메시지 표시 시점 (게임 완료 직전까지만)
            if (selectedDifficulty) {
              const totalPairs = DIFFICULTY_CONFIGS[selectedDifficulty].pairs;
              
              // 게임 완료 직전까지만 메시지 표시 (마지막 쌍은 게임 완료 화면에서 처리)
              let messagePoints: number[];
              let messages: string[];
              
              if (selectedDifficulty === "easy") {
                // 쉬움: 4쌍 → 1, 2, 3쌍 (4쌍은 게임 완료)
                messagePoints = [1, 2, 3];
                messages = [
                  "좋아요! 잘하고 있어요! 🎉",
                  "훌륭해요! 계속 화이팅! 💪",
                  "대단해요! 거의 다 왔어요! ⭐"
                ];
              } else if (selectedDifficulty === "normal") {
                // 보통: 8쌍 → 2, 4, 6쌍 (8쌍은 게임 완료)
                messagePoints = [2, 4, 6];
                messages = [
                  "좋아요! 잘하고 있어요! 🎉",
                  "훌륭해요! 계속 화이팅! 💪",
                  "대단해요! 거의 다 왔어요! ⭐"
                ];
              } else {
                // 어려움: 10쌍 → 2, 5, 8쌍 (10쌍은 게임 완료)
                messagePoints = [2, 5, 8];
                messages = [
                  "좋아요! 잘하고 있어요! 🎉",
                  "훌륭해요! 계속 화이팅! 💪",
                  "대단해요! 거의 다 왔어요! ⭐"
                ];
              }
              
              // 게임 완료 직전까지만 메시지 표시
              if (matchedPairs < totalPairs) {
                const messageIndex = messagePoints.indexOf(matchedPairs);
                if (messageIndex !== -1) {
                  setEncouragementMessage(messages[messageIndex]);
                  setTimeout(() => setEncouragementMessage(null), 2000);
                }
              }
            }
            
            return newMatched;
          });
          
          // 현재 streak 값을 기준으로 점수 계산
          const currentStreak = streakRef.current;
          const baseScore =
            selectedDifficulty != null
              ? DIFFICULTY_CONFIGS[selectedDifficulty].defaultScore
              : 0;
          const multiplier = currentStreak >= 1 ? 1 + currentStreak * 0.2 : 1;
          setScore((s) => s + baseScore * multiplier);
          
          // streak 증가
          streakRef.current = currentStreak + 1;
          setStreak(streakRef.current);
          
          setFlippedCards([]);
          setIsChecking(false);
        } else {
          // 매칭 실패
          setTimeout(() => {
            setFlippedCards([]);
            setIsChecking(false);
            setWrongAttempts((prev) => prev + 1);
            streakRef.current = 0;
            setStreak(0);
            setLives((prev) => prev - 1);
          }, 1000);
        }
        setMoveCount((prev) => prev + 1);
      }
    },
    [
      showingCards,
      flippedCards,
      matchedCards,
      isChecking,
      gameCards,
      selectedDifficulty,
      gameCompleted,
      gameOver,
    ]
  );

  const handleEndGame = async (mode: string, coin: number, index: number) => {
    const duration = playDurationSec ?? stopAndGetDuration();
    if (
      completedGames[
        DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex
      ]
    ) {
      router.back();
      return;
    } else if (
      !completedGames[
        DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex
      ] &&
      mode === "ads"
    ) {
      window.parent.postMessage(
        {
          type: "fromApp",
          payload: { advertise: true, coin: coin * 2, index: index },
        },
        "*"
      );
    } else if (
      !completedGames[
        DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].localIndex
      ] &&
      mode === "noAds"
    ) {
      await patchCompletedGame(
        loginId,
        DIFFICULTY_CONFIGS[selectedDifficulty as Difficulty].backendIndex,
        true,
        coin,
        duration,
        wrongAttempts
      );
      router.back();
    }
  };

  const restartGame = useCallback(() => {
    if (!selectedDifficulty) return;
    startGameWithDifficulty(selectedDifficulty);
  }, [selectedDifficulty, startGameWithDifficulty]);

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
    gameCards,
    gameCompleted,
    gameOver,
    showPrepareModal,
    showingCards,
    countdown,
    moveCount,
    completedGames,
    score,
    streak,
    lives,
    encouragementMessage,

    // 데이터
    backImage: gameData.backImage,

    // 핸들러 / 유틸
    startGameWithDifficulty,
    restartGame,
    handleCardClick,
    isCardFlipped,
    handleEndGame,
  };
}
