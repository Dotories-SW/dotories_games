// box-stacking/types.ts
import type { Body } from "planck-js";

export interface BoxInfo {
  body: Body;
  spriteIndex: number;
  settled: boolean;
  frozen?: boolean;
  stableTime?: number;
}

export interface CurrentBox {
  body: Body;
  isDropping: boolean;
  hasLanded?: boolean;
}

export interface DustEffect {
  x: number;
  y: number;
  frame: number;
  life: number;
}
