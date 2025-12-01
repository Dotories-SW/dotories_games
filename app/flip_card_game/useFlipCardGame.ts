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
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [showingCards, setShowingCards] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [moveCount, setMoveCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);

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
    : "691c2eefe90f06e920804f4e";

  const router = useRouter();
  const { start, stopAndGetDuration, reset } = useGameTimer();

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

    setGameCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
    setIsChecking(false);
    setGameCompleted(false);
    setShowDifficultySelect(false);
    setShowPrepareModal(true);
    setShowingCards(false);
    setCountdown(3);
    setMoveCount(0);
    setWrongAttempts(0);
    reset();
    start();
  }, []);

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

  // 게임 완료 시 서버에 완료 기록 + BGM 정지
  useEffect(() => {
    gameBgmRef.current?.pause();
  }, [gameCompleted]);

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
        flippedCards.length >= 2
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
          setMatchedCards((prev) => [...prev, firstId, secondId]);
          setFlippedCards([]);
          setIsChecking(false);
        } else {
          // 매칭 실패
          setTimeout(() => {
            setFlippedCards([]);
            setIsChecking(false);
            setWrongAttempts((prev) => prev + 1);
          }, 1000);
        }
        setMoveCount((prev) => prev + 1);
      }
    },
    [showingCards, flippedCards, matchedCards, isChecking, gameCards]
  );

  const handleEndGame = async (mode: string, coin: number, index: number) => {
    const playDurationSec = stopAndGetDuration();
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
        playDurationSec,
        wrongAttempts
      );
      router.back();
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
    gameCards,
    gameCompleted,
    showPrepareModal,
    showingCards,
    countdown,
    moveCount,
    completedGames,

    // 데이터
    backImage: gameData.backImage,

    // 핸들러 / 유틸
    startGameWithDifficulty,
    handleCardClick,
    isCardFlipped,
    handleEndGame,
  };
}
