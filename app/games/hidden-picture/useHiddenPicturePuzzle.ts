"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type React from "react";
import type { Puzzle, FoundCircle, MissMarker } from "./types";
import { pickRandomPuzzleId, checkHit } from "./utils";
import rawData from "@/public/game_json/hidden_picture_puzzle/data.json";

const allPuzzles = rawData.puzzles as Puzzle[];

export function useHiddenPicturePuzzle() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);

  const [foundItemIds, setFoundItemIds] = useState<string[]>([]);
  const [foundCircles, setFoundCircles] = useState<FoundCircle[]>([]);
  const [missMarkers, setMissMarkers] = useState<MissMarker[]>([]);
  const [missCount, setMissCount] = useState(0);

  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    successSoundRef.current = new Audio("/sounds/hidden_picture_puzzle/success.mp3");
    return () => {
      successSoundRef.current = null;
    };
  }, []);

  // 시작 화면에서 모든 이미지 미리 preload
  useEffect(() => {
    allPuzzles.forEach((puzzle) => {
      const img = new window.Image();
      img.src = puzzle.image;
    });
  }, []);

  // 모든 아이템 찾으면 완료
  useEffect(() => {
    if (!currentPuzzle || !gameStarted) return;
    if (foundItemIds.length > 0 && foundItemIds.length === currentPuzzle.items.length) {
      const timer = setTimeout(() => {
        setGameCompleted(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [foundItemIds, currentPuzzle, gameStarted]);

  const startGame = useCallback((puzzleId?: number) => {
    const id = puzzleId ?? pickRandomPuzzleId();
    const puzzle = allPuzzles.find((p) => p.id === id) ?? allPuzzles[0];

    setCurrentPuzzle(puzzle);
    setFoundItemIds([]);
    setFoundCircles([]);
    setMissMarkers([]);
    setMissCount(0);
    setGameCompleted(false);
    setImageLoaded(false);

    setGameStarted(true);
  }, []);

  const handleImagePointerDown = useCallback(
    (e: React.PointerEvent<HTMLImageElement>) => {
      if (!imageRef.current || !currentPuzzle || !gameStarted || gameCompleted) return;

      const rect = imageRef.current.getBoundingClientRect();
      const xFrac = (e.clientX - rect.left) / rect.width;
      const yFrac = (e.clientY - rect.top) / rect.height;

      if (xFrac < 0 || xFrac > 1 || yFrac < 0 || yFrac > 1) return;

      for (const item of currentPuzzle.items) {
        if (foundItemIds.includes(item.id)) continue;
        if (checkHit(xFrac, yFrac, item)) {
          if (successSoundRef.current) successSoundRef.current.currentTime = 0;
          successSoundRef.current?.play().catch(() => {});
          setFoundItemIds((prev) => [...prev, item.id]);
          setFoundCircles((prev) => [...prev, { itemId: item.id, x: item.x, y: item.y }]);
          return;
        }
      }

      // 미스
      const markerId = `miss-${Date.now()}-${Math.random()}`;
      setMissCount((prev) => prev + 1);
      setMissMarkers((prev) => [...prev, { id: markerId, x: xFrac, y: yFrac }]);
      setTimeout(() => {
        setMissMarkers((prev) => prev.filter((m) => m.id !== markerId));
      }, 900);
    },
    [currentPuzzle, foundItemIds, gameStarted, gameCompleted]
  );

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  return {
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
  };
}
