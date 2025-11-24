// box-stacking/useBoxStackingGame.ts
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { TouchEvent } from "react";
import planck, { Vec2, World, Body } from "planck-js";
import { useRouter, useSearchParams } from "next/navigation";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";

import {
  SCALE,
  TIME_STEP,
  TILT_LIMIT,
  CAMERA_LERP,
  CAMERA_MAX_STEP,
  BOX_IMAGE_PATHS,
  DUST_IMAGE_PATHS,
  FALLING_SOUND_PATH,
  getWorldSize,
  getGravityValue,
} from "./utils";
import type { BoxInfo, CurrentBox, DustEffect } from "./types";

export function useBoxStackingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxSizeRef = useRef<number>(3.3);

  // React state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : "691c2ca7e90f06e920804f4a";

  const router = useRouter();

  // 내부 상태 refs
  const worldRef = useRef<World | null>(null);
  const groundRef = useRef<Body | null>(null);
  const boxesRef = useRef<BoxInfo[]>([]);
  const currentBoxRef = useRef<CurrentBox | null>(null);
  const lastPlacedBoxRef = useRef<Body | null>(null);
  const cameraYRef = useRef<number>(0);

  const spawnYRef = useRef<number>(0);
  const spawnOffsetScreenRef = useRef<number>(0);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const gameOverRef = useRef<boolean>(false);
  const speedRef = useRef<number>(2);
  const perfectHitRef = useRef<number>(0);
  const dustEffectsRef = useRef<DustEffect[]>([]);
  const dustFramesRef = useRef<HTMLImageElement[]>([]);
  const pendingFailRef = useRef<boolean>(false);
  const fallingSoundRef = useRef<HTMLAudioElement | null>(null);

  // gameOver 상태와 ref 동기화
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // 오늘 게임 완료 여부 조회
  useEffect(() => {
    const getCompleted = async () => {
      const res = await getGameCompleted(loginId);
      let data = res.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      setIsCompleted(data[3]);
    };
    getCompleted();
  }, [loginId]);

  // 메인 게임 세팅 & 루프
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    fallingSoundRef.current = new Audio(FALLING_SOUND_PATH);
    fallingSoundRef.current.volume = 0.3;

    const updateCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const shorterSide = Math.min(width, height);
      const boxPixelSize = shorterSide * 0.008;
      boxSizeRef.current = boxPixelSize;

      // 스폰 위치 (스크린 기준 픽셀 오프셋)
      spawnOffsetScreenRef.current = height * 0.2;
    };

    updateCanvasSize();

    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener("resize", handleResize);

    // 반응형 중력
    const gravityValue = getGravityValue(window.innerHeight);

    const world = new planck.World({
      gravity: Vec2(0, gravityValue),
    });
    worldRef.current = world;

    // 충돌 감지 – 먼지/소리/landing 플래그
    world.on("begin-contact", (contact) => {
      const current = currentBoxRef.current;
      if (!current || !current.isDropping || current.hasLanded) return;

      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();

      if (bodyA !== current.body && bodyB !== current.body) return;

      const pos = current.body.getPosition();
      const BOX_SIZE = boxSizeRef.current ?? 3.3;

      dustEffectsRef.current.push({
        x: pos.x,
        y: pos.y + BOX_SIZE / 2,
        frame: 0,
        life: 1,
      });

      fallingSoundRef.current?.play();
      current.hasLanded = true;
    });

    // 월드 크기
    const { width: WORLD_WIDTH, height: WORLD_HEIGHT } = getWorldSize(
      window.innerWidth,
      window.innerHeight
    );

    // 바닥
    const ground = world.createBody({
      type: "static",
      position: Vec2(WORLD_WIDTH / 2, WORLD_HEIGHT - 0.25),
    });
    ground.createFixture(planck.Box(WORLD_WIDTH, 0.25), {
      friction: 0.8,
      restitution: 0.0,
    });
    groundRef.current = ground;

    // 이미지 로드
    const imgs = BOX_IMAGE_PATHS.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const dustImgs = DUST_IMAGE_PATHS.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    imagesRef.current = imgs;
    dustFramesRef.current = dustImgs;
    dustEffectsRef.current = [];

    boxesRef.current = [];
    currentBoxRef.current = null;
    lastPlacedBoxRef.current = null;
    cameraYRef.current = 0;
    spawnYRef.current =
      (spawnOffsetScreenRef.current || window.innerHeight * 0.33) / SCALE;
    pendingFailRef.current = false;
    speedRef.current = 2;
    setScore(0);
    setGameOver(false);

    // 일정 쌓인 부분을 얼려버리는 함수
    const freezeOldBoxes = () => {
      const boxes = boxesRef.current;

      const settledBoxes = boxes.filter(
        (b) => b.settled && !b.frozen && (b.stableTime || 0) > 0.5
      );
      if (settledBoxes.length <= 2) return;

      settledBoxes.sort(
        (a, b) => a.body.getPosition().y - b.body.getPosition().y
      );

      const freezeTargets = settledBoxes.slice(2);
      const SNAP_LIMIT = (5 * Math.PI) / 180;

      for (const box of freezeTargets) {
        if (box.frozen) continue;
        const angle = box.body.getAngle();

        if (Math.abs(angle) > SNAP_LIMIT) {
          continue;
        }

        const pos = box.body.getPosition();
        box.body.setTransform(pos, 0);

        box.body.setType("static");
        box.body.setLinearVelocity(Vec2(0, 0));
        box.body.setAngularVelocity(0);
        box.body.setAwake(false);

        box.frozen = true;
      }
    };

    // 새 상자 생성
    const spawnBox = () => {
      const BOX_SIZE = boxSizeRef.current;
      const camY = cameraYRef.current;
      const spawnOffsetScreen =
        spawnOffsetScreenRef.current || window.innerHeight * 0.33;
      const startY = camY + spawnOffsetScreen / SCALE;
      spawnYRef.current = startY;

      const startX = WORLD_WIDTH / 2;

      const body = world.createBody({
        type: "kinematic",
        position: Vec2(startX, startY),
        fixedRotation: false,
      });

      body.createFixture(planck.Box(BOX_SIZE / 2, BOX_SIZE / 2), {
        density: 1.0,
        friction: 0.6,
        restitution: 0.05,
      });

      const direction = Math.random() < 0.5 ? -1 : 1;
      const speed = speedRef.current;
      body.setLinearVelocity(Vec2(direction * speed, 0));

      const spriteIndex = Math.floor(Math.random() * 4);
      const info: BoxInfo = {
        body,
        spriteIndex,
        settled: false,
        frozen: false,
        stableTime: 0,
      };
      boxesRef.current.push(info);
      currentBoxRef.current = { body, isDropping: false, hasLanded: false };
    };

    spawnBox();

    let animationId: number | undefined;

    const loop = () => {
      animationId = requestAnimationFrame(loop);

      if (!worldRef.current) return;

      world.step(TIME_STEP);
      if (!gameOverRef.current) {
        updateLogic();
      }

      renderScene(ctx);
    };

    const updateLogic = () => {
      const world = worldRef.current;
      if (!world) return;

      const boxes = boxesRef.current;

      if (perfectHitRef.current > 0) {
        const decay = 1.8;
        perfectHitRef.current = Math.max(
          0,
          perfectHitRef.current - decay * TIME_STEP
        );
      }

      const BOX_SIZE = boxSizeRef.current;

      if (
        currentBoxRef.current &&
        currentBoxRef.current.isDropping &&
        !gameOverRef.current
      ) {
        const current = currentBoxRef.current;
        const body = current.body;
        const v = body.getLinearVelocity();
        const speed = Math.sqrt(v.x * v.x + v.y * v.y);
        const angVel = body.getAngularVelocity();
        const pos = body.getPosition();
        const lastBody = lastPlacedBoxRef.current;

        if (pendingFailRef.current && lastBody) {
          const worldHeight = window.innerHeight / SCALE;
          const cameraY = cameraYRef.current;
          const lastY = lastBody.getPosition().y;

          const belowStack = pos.y > lastY + BOX_SIZE * 1.2;
          const outOfView = pos.y - cameraY > worldHeight + BOX_SIZE;

          if (belowStack || outOfView) {
            pendingFailRef.current = false;
            current.isDropping = false;
            setGameOver(true);
            gameOverRef.current = true;
            return;
          }
        }

        const SETTLE_SPEED = 0.05;

        if (speed < SETTLE_SPEED && Math.abs(angVel) < 0.05) {
          current.isDropping = false;

          if (pendingFailRef.current) {
            pendingFailRef.current = false;
            setGameOver(true);
            gameOverRef.current = true;
            return;
          }

          pendingFailRef.current = false;
          lastPlacedBoxRef.current = body;

          setScore((prev) => {
            const next = prev + 1;
            if (next % 10 === 0) {
              speedRef.current += 0.5;
            }
            return next;
          });

          const boxInfo = boxes.find((b) => b.body === body);
          if (boxInfo) boxInfo.settled = true;

          freezeOldBoxes();
          spawnBox();
        }
      }

      // 카메라 위치 업데이트
      const lastBody = lastPlacedBoxRef.current;
      if (lastBody) {
        const lastPos = lastBody.getPosition();
        const currentCameraY = cameraYRef.current;
        const screenH = window.innerHeight;

        const desiredScreenY = screenH * 0.8;
        const rawTargetY = lastPos.y - desiredScreenY / SCALE;
        const targetCameraY = Math.min(rawTargetY, 0);
        const delta = targetCameraY - currentCameraY;

        const step = delta * CAMERA_LERP;
        const maxStep = CAMERA_MAX_STEP;
        const clampedStep = Math.max(-maxStep, Math.min(maxStep, step));

        cameraYRef.current = currentCameraY + clampedStep;
      }

      // 좌우 왕복 이동
      if (currentBoxRef.current && !currentBoxRef.current.isDropping) {
        const body = currentBoxRef.current.body;
        const pos = body.getPosition();
        const vel = body.getLinearVelocity();

        const margin = 0.5;
        if (pos.x < margin && vel.x < 0) {
          body.setLinearVelocity(Vec2(Math.abs(vel.x), 0));
        } else if (pos.x > WORLD_WIDTH - margin && vel.x > 0) {
          body.setLinearVelocity(Vec2(-Math.abs(vel.x), 0));
        }
      }

      // 먼지 업데이트
      dustEffectsRef.current = dustEffectsRef.current.filter((d) => d.life > 0);
      for (const d of dustEffectsRef.current) {
        d.life = Math.max(0, d.life - 0.012);
        d.y -= 0.005;
      }

      if (!gameOverRef.current) {
        const STABLE_SPEED = 0.08;
        const STABLE_ANG = 0.08;
        const RESET_SPEED = 0.4;
        const RESET_ANG = 0.4;

        for (const box of boxes) {
          if (box.frozen) continue;

          const vel = box.body.getLinearVelocity();
          const angVel = box.body.getAngularVelocity();
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

          if (speed < STABLE_SPEED && Math.abs(angVel) < STABLE_ANG) {
            box.stableTime = (box.stableTime ?? 0) + TIME_STEP;
          } else if (speed > RESET_SPEED || Math.abs(angVel) > RESET_ANG) {
            box.stableTime = 0;
          }

          const stableTime = box.stableTime ?? 0;
          if (stableTime > 0.5) {
            box.settled = true;
          }

          if (!box.settled) continue;

          const angle = Math.abs(box.body.getAngle());
          if (angle > TILT_LIMIT) {
            setGameOver(true);
            gameOverRef.current = true;
            break;
          }
        }
      }
    };

    const renderScene = (ctx: CanvasRenderingContext2D) => {
      const BOX_SIZE = boxSizeRef.current;
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      ctx.fillStyle = "#E0F2FE";
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      const cameraY = cameraYRef.current;

      const worldToScreen = (x: number, y: number) => {
        return {
          x: x * SCALE,
          y: (y - cameraY) * SCALE,
        };
      };

      const ground = groundRef.current;
      if (ground) {
        const pos = ground.getPosition();
        const hx = currentWidth / SCALE;
        const hy = 0.25;
        const { x, y } = worldToScreen(pos.x, pos.y);
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(
          x - hx * SCALE,
          y - hy * SCALE,
          hx * 2 * SCALE,
          hy * 2 * SCALE
        );
      }

      const lastBody = lastPlacedBoxRef.current;
      if (lastBody) {
        const lastPos = lastBody.getPosition();
        const guide = worldToScreen(lastPos.x, spawnYRef.current);
        const w = BOX_SIZE * SCALE;
        const h = BOX_SIZE * SCALE;

        const glow = perfectHitRef.current;

        ctx.save();
        if (glow > 0) {
          ctx.shadowColor = `rgba(250, 204, 21, ${0.6 * glow})`;
          ctx.shadowBlur = 25 * glow;
          ctx.lineWidth = 3 + 3 * glow;
          ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(253, 224, 71, 1)";
        } else {
          ctx.strokeStyle = "rgba(31,41,55,0.9)";
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
        }
        ctx.strokeRect(guide.x - w / 2, guide.y - h / 2, w, h);
        ctx.restore();
      }

      const imgs = imagesRef.current;

      for (const box of boxesRef.current) {
        const body = box.body;
        const pos = body.getPosition();
        const angle = body.getAngle();
        const { x, y } = worldToScreen(pos.x, pos.y);

        const w = BOX_SIZE * SCALE;
        const h = BOX_SIZE * SCALE;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const img = imgs[box.spriteIndex];
        if (img && img.complete) {
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          ctx.fillStyle = "#ffcc00";
          ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore();
      }

      for (const d of dustEffectsRef.current) {
        const frames = dustFramesRef.current.length || 1;
        const progress = 1 - d.life;
        let frameIndex = Math.floor(progress * frames);
        if (frameIndex >= frames) frameIndex = frames - 1;

        const img = dustFramesRef.current[frameIndex];
        const { x, y } = worldToScreen(d.x, d.y);
        const size = BOX_SIZE * SCALE * 1.6;

        ctx.save();
        ctx.globalAlpha = d.life;
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        ctx.restore();
      }
    };

    const loopStart = () => {
      animationId = requestAnimationFrame(loopStart);
      if (!worldRef.current) return;
      world.step(TIME_STEP);
      if (!gameOverRef.current) {
        updateLogic();
      }
      renderScene(ctx);
    };

    loopStart();

    

    return () => {
      if (animationId !== undefined) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      worldRef.current = null;
    };
  }, [gameStarted, resetToken]);

  // 클릭 시 상자 떨어뜨리기
  const handleClick = useCallback(() => {
    const BOX_SIZE = boxSizeRef.current;
    const world = worldRef.current;
    if (!world) return;
  
    if (gameOverRef.current) {
      setResetToken((v) => v + 1);
      return;
    }
  
    const current = currentBoxRef.current;
    if (!current || current.isDropping) return;
  
    const body = current.body;
    const lastBody = lastPlacedBoxRef.current;
  
    if (lastBody) {
      const currX = body.getPosition().x;
      const lastX = lastBody.getPosition().x;
  
      const perfectOffset = BOX_SIZE * 0.05;
      if (Math.abs(currX - lastX) <= perfectOffset) {
        perfectHitRef.current = 1;
      }
  
      const allowedOffset = BOX_SIZE * 0.55;
      if (Math.abs(currX - lastX) > allowedOffset) {
        pendingFailRef.current = true;
      }
    }
  
    body.setType("dynamic");
    body.setLinearVelocity(Vec2(0, 0));
    current.isDropping = true;

  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
    setResetToken((v) => v + 1);
  };

  const handleRetry = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setIsEnding(false);
    speedRef.current = 2;
  };

  const handleEndGame = async (mode: string) => {
    if(isCompleted){
      router.back();
      return;
    }
    
    if (isEnding) return;

    setIsEnding(true);
    setGameOver(true);
    fallingSoundRef.current?.pause();
    const acquiredCoin = Math.max(0, score - 10);

    if (!isCompleted && mode !== "ads") {
      window.parent.postMessage(
        {
          type: "fromApp",
          payload: { advertise: true, coin: acquiredCoin * 2 },
        },
        "*"
      );
    } else if (!isCompleted && mode === "noAds") {
      try {
        await patchCompletedGame(loginId, 3, true, acquiredCoin);
      } catch (e) {
        console.error("patchCompletedGame error", e);
      }
    }
    router.back();
  };

  const goBack = () => {
    router.back();
  };

  return {
    // refs
    canvasRef: canvasRef as RefObject<HTMLCanvasElement>,

    // state
    gameStarted,
    score,
    gameOver,
    isEnding,
    isCompleted,

    // handlers
    handleClick,
    handleStartGame,
    handleRetry,
    handleEndGame,
    goBack,
  };
}
