// box-stacking/useBoxStackingGame.ts
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import planck, { Vec2, World, Body } from "planck-js";
import { useRouter, useSearchParams } from "next/navigation";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";
import { BASE_LOGIN_ID } from "../constants/constants";

import {
  SCALE,
  TIME_STEP,
  TILT_LIMIT,
  CAMERA_LERP,
  CAMERA_MAX_STEP,
  BOX_IMAGE_PATHS,
  DUST_IMAGE_PATHS,
  SCORE_IMAGE_PATHS,
  FALLING_SOUND_PATH,
  getWorldSize,
  getGravityValue,
  getBoxSpeed,
  getBoxSpeedIncrement,
  BOX_STACK_SOUND_PATH,
} from "./utils";
import type { BoxInfo, CurrentBox, DustEffect, ScoreEffect } from "./types";
import { useGameTimer } from "../_hooks/useGameTimer";

export function useBoxStackingGame() {
  // 속도 스케일 (좌우 이동/낙하 공통)
  const SPEED_SCALE = 1.4;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxSizeRef = useRef<number>(3.3);

  // React state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : BASE_LOGIN_ID;
  const os: string = params.get("os") || "android"; // URL에서 os 파라미터 가져오기 (기본값: android)

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
  const scoreEffectsRef = useRef<ScoreEffect[]>([]);
  const scoreImagesRef = useRef<{ [key: number]: HTMLImageElement }>({});
  const pendingFailRef = useRef<boolean>(false);
  const pendingFailTimeRef = useRef<number>(0);  // fail 판정 후 경과 시간
  const fallingSoundRef = useRef<HTMLAudioElement | null>(null);
  const boxStackSoundRef = useRef<HTMLAudioElement | null>(null);
  const scoreRef = useRef<number>(0);
  const failedBoxPositionRef = useRef<{ x: number; y: number } | null>(null);
  
  // 시간 측정 및 FPS 모니터링용 refs
  const lastFrameTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);
  const screenWidthRef = useRef<number>(0);
  const screenHeightRef = useRef<number>(0);
  
  const { start, stopAndGetDuration, reset } = useGameTimer();

  // gameOver 상태와 ref 동기화
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // score 상태와 ref 동기화
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

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

    perfectHitRef.current = 0;

    fallingSoundRef.current = new Audio(FALLING_SOUND_PATH);
    fallingSoundRef.current.volume = 0.3;

    boxStackSoundRef.current = new Audio(BOX_STACK_SOUND_PATH);
    boxStackSoundRef.current.loop = true;
    boxStackSoundRef.current.volume = 0.1;
    // 게임 시작시 BGM 자동 재생
    boxStackSoundRef.current.play().catch(console.error);

    // 반응형 중력
    const gravityValue = getGravityValue(window.innerHeight) * SPEED_SCALE;

    const world = new planck.World({
      gravity: Vec2(0, gravityValue),
    });
    worldRef.current = world;

    const updateCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      screenWidthRef.current = width;
      screenHeightRef.current = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // 게임 영역 폭 제한 (큰 화면에서 최대 600px)
      const MAX_GAME_WIDTH = 600;
      const effectiveWidth = Math.min(width, MAX_GAME_WIDTH);
      
      // 화면 비율 계산 (태블릿 vs 스마트폰 구분)
      const aspectRatio = width / height;
      const isTablet = aspectRatio > 0.7; // 태블릿은 가로가 더 넓음
      const isLargeTablet = width >= 1024; // 큰 태블릿
      
      const shorterSide = Math.min(effectiveWidth, height);
      // 큰 태블릿: 0.18, 일반 태블릿: 0.2, 스마트폰: 0.22 (모바일만 살짝 축소)
      let boxSizeRatio = 0.22;
      if (isLargeTablet) {
        boxSizeRatio = 0.16;
      } else if (isTablet) {
        boxSizeRatio = 0.2;
      }
      
      const boxPixelSize = shorterSide * boxSizeRatio;
      // 픽셀 단위를 월드 단위로 변환하고, 상한선 설정 (최대 5m)
      const boxSizeWorld = boxPixelSize / SCALE;
      boxSizeRef.current = Math.min(boxSizeWorld, 5);

      // 스폰 위치 (스크린 기준 픽셀 오프셋)
      // 태블릿에서는 더 위쪽에서 spawn하여 간격 확보
      let spawnOffsetRatio = 0.12; // 모바일 기본값
      if (isLargeTablet || isTablet) {
        spawnOffsetRatio = 0.08; // 큰 태블릿: 훨씬 더 위쪽
      }
      spawnOffsetScreenRef.current = height * spawnOffsetRatio;

      // resize 시 중력값도 업데이트
      if (worldRef.current) {
        const newGravityValue = getGravityValue(height) * SPEED_SCALE;
        worldRef.current.setGravity(Vec2(0, newGravityValue));
      }
    };

    updateCanvasSize();

    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener("resize", handleResize);

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

    // 바닥 - 화면 하단 바로 위에 위치하도록 수정
    const groundY = WORLD_HEIGHT - 0.2; // 화면 하단에서 아주 조금만 위쪽에 바닥 생성
    const ground = world.createBody({
      type: "static",
      position: Vec2(WORLD_WIDTH / 2, groundY),
    });
    ground.createFixture(planck.Box(WORLD_WIDTH / 2, 0.2), { // 바닥 두께를 얇게 조정
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

    // 점수 이미지 로드
    const scoreImgs: { [key: number]: HTMLImageElement } = {};
    Object.entries(SCORE_IMAGE_PATHS).forEach(([score, src]) => {
      const img = new Image();
      img.src = src;
      scoreImgs[Number(score)] = img;
    });

    imagesRef.current = imgs;
    dustFramesRef.current = dustImgs;
    scoreImagesRef.current = scoreImgs;
    dustEffectsRef.current = [];
    scoreEffectsRef.current = [];

    boxesRef.current = [];
    currentBoxRef.current = null;
    lastPlacedBoxRef.current = null;
    cameraYRef.current = 0;
    
    // 초기 spawn Y 위치를 이후 스폰 로직과 동일하게 설정
    const BOX_SIZE = boxSizeRef.current;
    spawnYRef.current = cameraYRef.current + BOX_SIZE;
    pendingFailRef.current = false;
    failedBoxPositionRef.current = null;
    // 화면 너비 기반 속도 설정 (OS 기반 보정 포함)
    speedRef.current = getBoxSpeed(window.innerWidth, os) * SPEED_SCALE;
    setScore(0);
    setGameOver(false);

    // 일정 쌓인 부분을 얼려버리는 함수
    const freezeOldBoxes = () => {
      const boxes = boxesRef.current;

      // 전체 settled 박스 가져오기 (freeze 여부 상관없이)
      const allSettledBoxes = boxes.filter((b) => b.settled);
      
      // 최소 3개 이상 쌓여야 freeze 시작
      if (allSettledBoxes.length <= 2) return;

      // Y 좌표 오름차순 정렬 (위쪽 박스부터)
      allSettledBoxes.sort(
        (a, b) => a.body.getPosition().y - b.body.getPosition().y
      );

      // 위 2개는 제외하고 나머지(아래쪽)만 freeze 대상
      // 단, 이미 freeze된 것과 아직 안정화 시간이 부족한 것은 제외
      const freezeTargets = allSettledBoxes.slice(2).filter(
        (b) => !b.frozen && (b.stableTime || 0) > 0.4
      );
      
      // 각도 허용 범위
      const SMALL_ANGLE = (5 * Math.PI) / 180;  // 5도: 거의 평평 → 0도로 보정
      const MAX_ANGLE = (12 * Math.PI) / 180;    // 12도: 최대 허용 각도

      for (const box of freezeTargets) {
        if (box.frozen) continue;
        const angle = box.body.getAngle();
        const absAngle = Math.abs(angle);

        // 12도 이상 기울어진 박스는 freeze 안 함 (불안정)
        if (absAngle > MAX_ANGLE) {
          continue;
        }

        const pos = box.body.getPosition();
        
        // 각도별 차등 처리
        if (absAngle <= SMALL_ANGLE) {
          // 5도 이하: 거의 평평 → 0도로 보정해서 freeze (완벽하게 평행)
          box.body.setTransform(pos, 0);
        } else {
          // 5~12도: 약간 기울어짐 → 현재 각도 유지하되 freeze
          // (아래쪽 박스들은 약간 기울어져도 괜찮음)
          box.body.setTransform(pos, angle);
        }

        box.body.setType("static");
        box.body.setLinearVelocity(Vec2(0, 0));
        box.body.setAngularVelocity(0);
        box.body.setAwake(false);

        // Frozen 박스를 더 확실하게 보호
        // 위치와 각도를 저장하여 나중에 강제로 복원할 수 있도록
        box.frozenPosition = { x: pos.x, y: pos.y };
        box.frozenAngle = absAngle <= SMALL_ANGLE ? 0 : angle;
        box.frozen = true;
      }

      // 화면 아래로 멀리 벗어난 frozen 박스 제거 (메모리/성능 최적화)
      const pruneY = cameraYRef.current + (window.innerHeight / SCALE) * 2;
      boxesRef.current = boxesRef.current.filter((box) => {
        if (!box.frozen) return true;
        const pos = box.body.getPosition();
        if (pos.y > pruneY) {
          try {
            world.destroyBody(box.body);
          } catch (e) {
            // ignore
          }
          return false;
        }
        return true;
      });
    };

    // 새 상자 생성
    const spawnBox = () => {
      const BOX_SIZE = boxSizeRef.current;
      const camY = cameraYRef.current;
      
      // 화면 상단에서 박스 크기만큼 위쪽에 스폰 (확실히 보이도록)
      const startY = camY + BOX_SIZE; // 카메라 위치에서 박스 크기만큼 위쪽
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
    
    // 시간 측정 초기화
    lastFrameTimeRef.current = performance.now();
    lastFpsUpdateRef.current = performance.now();
    frameCountRef.current = 0;
    fpsRef.current = 60;

    let animationId: number | undefined;
    let active = true;

    const loop = (currentTime: number) => {
      if (!active) return;
      const w = worldRef.current;
      if (!w) return;

      // FPS 모니터링 (1초마다 업데이트)
      frameCountRef.current++;
      if (currentTime - lastFpsUpdateRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = currentTime;
      }

      // 실제 경과 시간 계산 (밀리초 → 초)
      const deltaTime = lastFrameTimeRef.current > 0
        ? (currentTime - lastFrameTimeRef.current) / 1000
        : TIME_STEP;
      const clampedDeltaTime = Math.min(deltaTime, TIME_STEP * 2);

      // 물리 엔진은 고정 시간 스텝 사용 (안정성을 위해)
      w.step(TIME_STEP);

      if (!gameOverRef.current) {
        // 게임 로직 업데이트는 실제 경과 시간 사용 (이펙트 등)
        updateLogic(clampedDeltaTime);
        renderScene(ctx);
        animationId = requestAnimationFrame(loop);
      }

      lastFrameTimeRef.current = currentTime;
    };

    // loop 함수 시작 (requestAnimationFrame이 자동으로 timestamp를 전달)
    animationId = requestAnimationFrame(loop);

    const updateLogic = (deltaTime: number) => {
      const world = worldRef.current;
      if (!world) return;

      const boxes = boxesRef.current;

      if (perfectHitRef.current > 0) {
        const decay = 1.8;
        perfectHitRef.current = Math.max(
          0,
          perfectHitRef.current - decay * deltaTime
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

        // 떨어지는 박스가 스택에서 벗어나거나 화면 밖으로 나가면 게임 오버
        if (lastBody) {
          const worldHeight = screenHeightRef.current / SCALE;
          const cameraY = cameraYRef.current;
          const lastY = lastBody.getPosition().y;

          // 1. 스택 아래로 떨어짐 (Y 위치 체크)
          const belowStack = pos.y > lastY + BOX_SIZE * 1.5;
          
          // 2. 화면 밖으로 나감
          const outOfView = pos.y - cameraY > worldHeight + BOX_SIZE;
          
          // 3. 수평으로 너무 멀리 벗어남 (X 위치 체크)
          const lastX = lastBody.getPosition().x;
          const horizontalDistance = Math.abs(pos.x - lastX);
          const tooFarAway = horizontalDistance > BOX_SIZE * 2;

          if (belowStack || outOfView || tooFarAway) {
            // fail 판정이지만, 최소 0.5초는 기회를 줌
            if (pendingFailRef.current) {
              pendingFailTimeRef.current += deltaTime;
              
              // 0.5초 이상 경과하거나, 완전히 화면 밖으로 나간 경우만 게임 오버
              if (pendingFailTimeRef.current > 0.5 || outOfView) {
                failedBoxPositionRef.current = { x: pos.x, y: pos.y };
                current.hitAccuracy = "fail";
                pendingFailRef.current = false;
                pendingFailTimeRef.current = 0;
                current.isDropping = false;
                setGameOver(true);
                gameOverRef.current = true;
                return;
              }
            } else {
              // 처음 fail 조건 만족 시 타이머 시작
              pendingFailRef.current = true;
              pendingFailTimeRef.current = 0;
            }
          } else {
            // 조건을 벗어나면 fail 판정 리셋 (착지 성공 가능성)
            if (pendingFailRef.current) {
              pendingFailRef.current = false;
              pendingFailTimeRef.current = 0;
            }
          }
        }

        const SETTLE_SPEED = 0.05;

        if (speed < SETTLE_SPEED && Math.abs(angVel) < 0.05) {
          current.isDropping = false;

          // "쌓이지 않았는데도 성공 처리"되는 케이스 방지:
          // 박스가 멈췄더라도, 마지막 박스 위(충분히 위쪽)에 올라가지 못했다면 실패 처리
          if (lastBody) {
            const lastPos = lastBody.getPosition();
            const dx = Math.abs(pos.x - lastPos.x);
            const dy = lastPos.y - pos.y; // 양수면 현재 박스가 마지막 박스보다 위(정상 스택 방향)

            // 정상적으로 쌓이면 dy는 대략 BOX_SIZE 근처가 됨 (센터 간 거리)
            // 바닥/옆에 착지한 경우 dy가 작거나(≈0) dx가 너무 큼
            const stackedEnough = dy > BOX_SIZE * 0.5 && dx < BOX_SIZE * 0.9;

            if (!stackedEnough) {
              failedBoxPositionRef.current = { x: pos.x, y: pos.y };
              current.hitAccuracy = "fail";
              pendingFailRef.current = false;
              pendingFailTimeRef.current = 0;
              setGameOver(true);
              gameOverRef.current = true;
              return;
            }
          }

          if (pendingFailRef.current) {
            // 실제로 떨어진 박스의 위치를 저장
            failedBoxPositionRef.current = { x: pos.x, y: pos.y };
            pendingFailRef.current = false;
            setGameOver(true);
            gameOverRef.current = true;
            return;
          }

          pendingFailRef.current = false;
          lastPlacedBoxRef.current = body;

          // 정확도에 따른 차등 점수 부여
          const accuracy = current.hitAccuracy || "normal";
          let pointsToAdd = 0;
          
          if (accuracy === "perfect") {
            pointsToAdd = 10;
          } else if (accuracy === "good") {
            pointsToAdd = 7;
          } else if (accuracy === "normal") {
            pointsToAdd = 5;
          } else {
            // fail인 경우 점수 없음 (이미 게임 오버 처리됨)
            pointsToAdd = 0;
          }

          // 점수 이펙트 생성
          if (pointsToAdd > 0 && (pointsToAdd === 5 || pointsToAdd === 7 || pointsToAdd === 10)) {
            const boxPos = body.getPosition();
            const BOX_SIZE = boxSizeRef.current ?? 3.3;
            scoreEffectsRef.current.push({
              x: boxPos.x + BOX_SIZE / 2,
              y: boxPos.y - BOX_SIZE / 2,
              score: pointsToAdd as 5 | 7 | 10,
              life: 1.0,
              opacity: 1.0,
            });
          }

          // 70점 단위로 속도 증가 체크 (spawnBox 전에 먼저 처리!)
          const currentScore = scoreRef.current;
          const nextScore = currentScore + pointsToAdd;
          const prevThreshold = Math.floor(currentScore / 70);
          const nextThreshold = Math.floor(nextScore / 70);
          const thresholdsCrossed = nextThreshold - prevThreshold;
          
          if (thresholdsCrossed > 0) {
            // 넘어간 threshold 개수만큼 속도 증가 (OS 기반 보정 포함)
            speedRef.current +=
              getBoxSpeedIncrement(window.innerWidth, os) *
              SPEED_SCALE *
              thresholdsCrossed;
          }

          // 점수 업데이트
          setScore(nextScore);

          const boxInfo = boxes.find((b) => b.body === body);
          if (boxInfo) boxInfo.settled = true;

          freezeOldBoxes();
          spawnBox(); // 이제 업데이트된 속도로 새 박스 생성!
        }
      }

      // 카메라 위치 업데이트
      const lastBody = lastPlacedBoxRef.current;
      if (lastBody) {
        const lastPos = lastBody.getPosition();
        const currentCameraY = cameraYRef.current;
        const screenH = screenHeightRef.current;

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

        // 큰 태블릿(1024px 이상)에서는 이동 범위를 중앙으로 제한
        const screenWidth = screenWidthRef.current;
        const isLargeTablet = screenWidth >= 1024;
        
        let leftMargin, rightMargin;
        if (isLargeTablet) {
          // 큰 태블릿: 25% ~ 75% 범위
          leftMargin = WORLD_WIDTH * 0.25;
          rightMargin = WORLD_WIDTH * 0.75;
        } else {
          // 일반 기기: 15% ~ 85% 범위
          leftMargin = WORLD_WIDTH * 0.15;
          rightMargin = WORLD_WIDTH * 0.85;
        }
        
        if (pos.x < leftMargin && vel.x < 0) {
          body.setLinearVelocity(Vec2(Math.abs(vel.x), 0));
        } else if (pos.x > rightMargin && vel.x > 0) {
          body.setLinearVelocity(Vec2(-Math.abs(vel.x), 0));
        }
      }

      // 먼지 업데이트
      dustEffectsRef.current = dustEffectsRef.current.filter((d) => d.life > 0);
      for (const d of dustEffectsRef.current) {
        d.life = Math.max(0, d.life - 0.012);
        d.y -= 0.005;
      }

      // 점수 이펙트 업데이트
      scoreEffectsRef.current = scoreEffectsRef.current.filter((s) => s.life > 0);
      for (const s of scoreEffectsRef.current) {
        s.life = Math.max(0, s.life - 0.015);
        s.opacity = s.life;
        s.y -= 0.02; // 위로 올라감
      }

      if (!gameOverRef.current) {
        // Frozen 박스들의 위치 강제 고정 (충돌로 인한 움직임 방지)
        for (const box of boxes) {
          if (box.frozen && box.frozenPosition && box.frozenAngle !== undefined) {
            const currentPos = box.body.getPosition();
            const currentAngle = box.body.getAngle();
            
            // 위치나 각도가 조금이라도 변했으면 강제로 복원
            const posDiff = Math.abs(currentPos.x - box.frozenPosition.x) + 
                           Math.abs(currentPos.y - box.frozenPosition.y);
            const angleDiff = Math.abs(currentAngle - box.frozenAngle);
            
            if (posDiff > 0.001 || angleDiff > 0.001) {
              box.body.setTransform(
                Vec2(box.frozenPosition.x, box.frozenPosition.y),
                box.frozenAngle
              );
              box.body.setLinearVelocity(Vec2(0, 0));
              box.body.setAngularVelocity(0);
            }
          }
        }

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
            box.stableTime = (box.stableTime ?? 0) + deltaTime;
          } else if (speed > RESET_SPEED || Math.abs(angVel) > RESET_ANG) {
            box.stableTime = 0;
          }

          const stableTime = box.stableTime ?? 0;
          if (stableTime > 0.5) {
            box.settled = true;
          }

          if (!box.settled) continue;

          const angle = Math.abs(box.body.getAngle());
          
          // 기울어진 상태 체크
          if (angle > TILT_LIMIT) {
            // tiltTime 초기화 (없으면 0)
            if (box.tiltTime === undefined) {
              box.tiltTime = 0;
            }
            
            // 기울어진 시간 누적
            box.tiltTime += deltaTime;
            
            // 0.3초 이상 기울어진 상태가 지속되면 게임 오버
            if (box.tiltTime > 0.3) {
              setGameOver(true);
              gameOverRef.current = true;
              break;
            }
          } else {
            // 각도가 정상이면 tiltTime 리셋
            box.tiltTime = 0;
          }
          
          // settled 박스가 스택에서 떨어졌는지 체크 (frozen 제외)
          if (!box.frozen && lastPlacedBoxRef.current) {
            const boxPos = box.body.getPosition();
            const lastPos = lastPlacedBoxRef.current.getPosition();
            const worldHeight = screenHeightRef.current / SCALE;
            const cameraY = cameraYRef.current;
            
            // 1. 마지막 박스보다 아래로 많이 떨어짐
            const belowStack = boxPos.y > lastPos.y + BOX_SIZE * 2;
            
            // 2. 화면 밖으로 나감
            const outOfView = boxPos.y - cameraY > worldHeight + BOX_SIZE;
            
            // 3. 수평으로 너무 멀리 떨어짐
            const horizontalDistance = Math.abs(boxPos.x - lastPos.x);
            const tooFarAway = horizontalDistance > BOX_SIZE * 3;
            
            if (belowStack || outOfView || tooFarAway) {
              failedBoxPositionRef.current = { x: boxPos.x, y: boxPos.y };
              setGameOver(true);
              gameOverRef.current = true;
              break;
            }
          }
        }
      }
    };

    const renderScene = (ctx: CanvasRenderingContext2D) => {
      const BOX_SIZE = boxSizeRef.current;
      const currentWidth = screenWidthRef.current;
      const currentHeight = screenHeightRef.current;
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      ctx.fillStyle = "#F5F1E8";
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
        if (glow > 0 && scoreRef.current > 0) {
          ctx.lineWidth = 3 + 3 * glow;
          ctx.setLineDash([]);
          ctx.strokeStyle = `rgba(253, 204, 21, ${glow})`;
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

      // 점수 이펙트 렌더링
      for (const s of scoreEffectsRef.current) {
        const img = scoreImagesRef.current[s.score];
        if (!img || !img.complete) continue;

        const { x, y } = worldToScreen(s.x, s.y);
        const width = BOX_SIZE * SCALE * 1.2;
        const height = (img.height / img.width) * width;

        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
        ctx.restore();
      }
    };

    return () => {
      active = false;
      if (animationId !== undefined) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      
      // 모든 오디오 정지 및 정리
      if (boxStackSoundRef.current) {
        boxStackSoundRef.current.pause();
        boxStackSoundRef.current.currentTime = 0;
        boxStackSoundRef.current = null;
      }
      if (fallingSoundRef.current) {
        fallingSoundRef.current.pause();
        fallingSoundRef.current.currentTime = 0;
        fallingSoundRef.current = null;
      }
      
      // 물리 엔진 완전 정리
      if (worldRef.current) {
        try {
          // 모든 박스 Body들을 안전하게 제거
          for (const box of boxesRef.current) {
            if (box.body && worldRef.current) {
              try {
                // Body가 아직 World에 존재하는지 확인
                if (box.body.getWorld() === worldRef.current) {
                  worldRef.current.destroyBody(box.body);
                }
              } catch (e) {
                console.warn("Error destroying box body:", e);
              }
            }
          }
          
          // 바닥 Body 안전하게 제거
          if (groundRef.current && worldRef.current) {
            try {
              if (groundRef.current.getWorld() === worldRef.current) {
                worldRef.current.destroyBody(groundRef.current);
              }
            } catch (e) {
              console.warn("Error destroying ground body:", e);
            }
          }
        } catch (e) {
          console.warn("Error during physics cleanup:", e);
        }
        
        // World 객체 완전 정리
        worldRef.current = null;
      }
      
      // 모든 ref 초기화
      groundRef.current = null;
      boxesRef.current = [];
      currentBoxRef.current = null;
      lastPlacedBoxRef.current = null;
      cameraYRef.current = 0;
      spawnYRef.current = 0;
      gameOverRef.current = false;
      speedRef.current = 2;
      perfectHitRef.current = 0;
      dustEffectsRef.current = [];
      scoreEffectsRef.current = [];
      pendingFailRef.current = false;
      scoreRef.current = 0;
      failedBoxPositionRef.current = null;
      imagesRef.current = [];
      dustFramesRef.current = [];
      scoreImagesRef.current = {};
    };
  }, [gameStarted, resetToken, os]);

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
      const offset = Math.abs(currX - lastX);

      const perfectOffset = BOX_SIZE * 0.05;  // 5% 이내: Perfect
      const goodOffset = BOX_SIZE * 0.25;      // 25% 이내: Good
      const allowedOffset = Math.max(0.3, BOX_SIZE * 0.5);  // 50% 이내: Normal
      
      // 정확도 레벨 결정 (3단계)
      if (offset <= perfectOffset) {
        perfectHitRef.current = 1;
        current.hitAccuracy = "perfect";  // 10점: 매우 정확
      } else if (offset <= goodOffset) {
        current.hitAccuracy = "good";     // 7점: 정확
      } else if (offset <= allowedOffset) {
        current.hitAccuracy = "normal";   // 5점: 보통
      } else {
        current.hitAccuracy = "fail";     // 0점: 실패
        pendingFailRef.current = true;
      }
    } else {
      // 첫 번째 상자는 항상 perfect로 처리
      current.hitAccuracy = "perfect";
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
    reset();
    start();
    // BGM은 useEffect에서 Audio 객체 생성 후 자동으로 재생됩니다
  };

  // 게임오버 시 버튼 비활성화 타이머
  useEffect(() => {
    if (!gameOver) return;
    
    // 게임 오버 시 3초간 버튼 비활성화
    setIsResetting(true);
    
    const timer = setTimeout(() => {
      setIsResetting(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [gameOver]);

  const handleRetry = () => {
    // 이미 정리 중이면 무시
    if (isResetting) return;
    
    // 시작 화면으로 돌아가기 (이때 물리 엔진 cleanup이 실행됨)
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
  };

  const handleEndGame = async (mode: string, index: number) => {
    const playDurationSec = stopAndGetDuration();
    if (isCompleted) {
      router.back();
      return;
    }

    if (isEnding) return;

    setIsEnding(true);
    setGameOver(true);
    fallingSoundRef.current?.pause();
    boxStackSoundRef.current?.pause();

    // 실제로 떨어진 박스가 왼쪽/오른쪽으로 떨어졌는지 판단
    let fallDirection: "left" | "right" = "left";
    if (failedBoxPositionRef.current) {
      const { width: WORLD_WIDTH } = getWorldSize(window.innerWidth, window.innerHeight);
      const centerX = WORLD_WIDTH / 2;
      const failedBoxX = failedBoxPositionRef.current.x;
      
      if (failedBoxX < centerX) {
        fallDirection = "left";
      } else {
        fallDirection = "right";
      }
    } else if (lastPlacedBoxRef.current) {
      // failedBoxPositionRef가 없는 경우 (상자가 기울어져서 게임 오버된 경우) 마지막 박스 사용
      const lastPos = lastPlacedBoxRef.current.getPosition();
      const { width: WORLD_WIDTH } = getWorldSize(window.innerWidth, window.innerHeight);
      const centerX = WORLD_WIDTH / 2;
      
      if (lastPos.x < centerX) {
        fallDirection = "left";
      } else {
        fallDirection = "right";
      }
    }

    console.log("fallDirection", fallDirection);
    
    // 코인 계산: 70점 이상부터 10개, 이후 10점마다 1개씩 추가, 최대 25개
    const acquiredCoin = score < 70 ? 0 : Math.min(25, 10 + Math.floor((score - 70) / 10));

    if (!isCompleted && mode === "ads") {
      window.parent.postMessage(
        {
          type: "fromApp",
          payload: { advertise: true, coin: acquiredCoin * 2, index: index, durationsec: playDurationSec, score: score, description: fallDirection },
        },
        "*"
      );
    } else if (!isCompleted && mode === "noAds") {
      try {
        await patchCompletedGame(
          loginId,
          3,
          true,
          acquiredCoin,
          playDurationSec,
          score,
          fallDirection
        );
      } catch (e) {
        console.error("patchCompletedGame error", e);
      } finally {
        router.back();
      }
    }
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
    isResetting,

    // handlers
    handleClick,
    handleStartGame,
    handleRetry,
    handleEndGame,
    goBack,
  };
}
