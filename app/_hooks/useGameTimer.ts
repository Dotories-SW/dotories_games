// app/_hooks/useGameTimer.ts
import { useRef, useState } from "react";

export function useGameTimer() {
  const startTimeRef = useRef<number | null>(null);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  const start = () => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  };

  // "클리어 직전"에 호출해서 최종 시간 계산
  const stopAndGetDuration = () => {
    if (!startTimeRef.current) return 0;
    const diffSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setDurationSec(diffSec);
    setIsRunning(false);
    return diffSec;
  };

  const reset = () => {
    startTimeRef.current = null;
    setDurationSec(0);
    setIsRunning(false);
  };

  return { start, stopAndGetDuration, reset, durationSec, isRunning };
}
