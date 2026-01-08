// box-stacking/types.ts
import type { Body } from "planck-js";

export interface BoxInfo {
  body: Body;
  spriteIndex: number;
  settled: boolean;
  frozen?: boolean;
  stableTime?: number;
  tiltTime?: number;  // 기울어진 시간 추적
  frozenPosition?: { x: number; y: number };
  frozenAngle?: number;
}

export interface CurrentBox {
  body: Body;
  isDropping: boolean;
  hasLanded?: boolean;
  hitAccuracy?: "perfect" | "good" | "normal" | "fail";
}

export interface DustEffect {
  x: number;
  y: number;
  frame: number;
  life: number;
}

export interface ScoreEffect {
  x: number;
  y: number;
  score: 5 | 7 | 10;
  life: number;
  opacity: number;
}