"use client";

import React, { useEffect, useRef, useState } from "react";
import planck, { Vec2, World, Body } from "planck-js";

const SCALE = 40; // 1 meter = 40 px
const BOX_SIZE = 3.3; // 상자 크기
const TIME_STEP = 1 / 60;

// 반응형 기준값 (필요하면 조정)
const BASE_SCREEN_HEIGHT = 800; // 기준 화면 높이
const BASE_GRAVITY = 10; // 기준 중력 (기준 높이일 때)

// settled 박스들 tilt 체크 기준 (10도)
const TILT_LIMIT = (10 * Math.PI) / 180;

const CAMERA_LERP = 0.08; // 카메라가 타겟을 따라가는 정도 (0.05~0.1 사이 추천)
const CAMERA_MAX_STEP = 0.25; // 한 프레임당 카메라가 움직일 수 있는 최대 거리(m)

interface BoxInfo {
  body: Body;
  spriteIndex: number;
  settled: boolean;
  frozen?: boolean;
  stableTime? : number;
}

interface CurrentBox {
  body: Body;
  isDropping: boolean;
}

interface DustEffect {
  x: number;
  y: number;
  frame: number;
  life: number;
}

function BoxStacking() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 게임 상태 (React state)
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  // 내부 상태 (ref로 관리)
  const worldRef = useRef<World | null>(null);
  const groundRef = useRef<Body | null>(null);
  const boxesRef = useRef<BoxInfo[]>([]);
  const currentBoxRef = useRef<CurrentBox | null>(null);
  const lastPlacedBoxRef = useRef<Body | null>(null);
  const cameraYRef = useRef<number>(0);

  const spawnYRef = useRef<number>(0); // 현재 스폰 Y (월드 좌표)
  const spawnOffsetScreenRef = useRef<number>(0); // 화면 기준 스폰 오프셋(px)

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const gameOverRef = useRef<boolean>(false);
  const speedRef = useRef<number>(2);
  const perfectHitRef = useRef<number>(0); // 0~1 사이 값으로 효과 강도
  const dustEffectsRef = useRef<DustEffect[]>([]);
  const dustFramesRef = useRef<HTMLImageElement[]>([]);
  const pendingFailRef = useRef<boolean>(false); // ❗ 실패 예정 플래그

  // gameOver 상태 ref 동기화
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // 메인 게임 세팅 & 루프
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 및 반응형 파라미터 설정
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

      // 화면 높이 비율 기반으로 스폰 위치 / 카메라 기준 계산
      // 예: 스폰은 화면 위에서 1/3 지점, 마지막 박스는 최소 40% 지점보다 아래
      spawnOffsetScreenRef.current = height * 0.2; // 스폰 위치 조정
    };

    updateCanvasSize();

    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener("resize", handleResize);

    // 화면 크기 기반 중력값 계산
    const screenHeight = window.innerHeight || BASE_SCREEN_HEIGHT;
    const gravityScaleRaw = screenHeight / BASE_SCREEN_HEIGHT;
    const gravityScale = Math.max(0.7, Math.min(1.4, gravityScaleRaw)); // 0.7~1.4 배 사이로 클램프
    const gravityValue = BASE_GRAVITY * gravityScale;

    // Planck world 생성 (반응형 중력)
    const world = new planck.World({
      gravity: Vec2(0, gravityValue),
    });
    worldRef.current = world;

    // 월드 크기 (화면 크기 기반)
    const getWorldSize = () => {
      const w = window.innerWidth / SCALE;
      const h = window.innerHeight / SCALE;
      return { width: w, height: h };
    };

    const { width: WORLD_WIDTH, height: WORLD_HEIGHT } = getWorldSize();

    // 땅 만들기 (화면 아래쪽)
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
    const paths = [
      "/box/box_1.png",
      "/box/box_2.png",
      "/box/box_3.png",
      "/box/box_4.png",
    ];
    const dustPaths = [
      "/box/effect/dust_1.png",
      "/box/effect/dust_2.png",
      "/box/effect/dust_3.png",
      "/box/effect/dust_4.png",
    ];

    const imgs = paths.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const dustImgs = dustPaths.map((src) => {
      const dustImg = new Image();
      dustImg.src = src;
      return dustImg;
    });

    dustEffectsRef.current = [];
    dustFramesRef.current = dustImgs;

    imagesRef.current = imgs;

    // ref 초기화
    boxesRef.current = [];
    currentBoxRef.current = null;
    lastPlacedBoxRef.current = null;
    cameraYRef.current = 0;
    spawnYRef.current =
      (spawnOffsetScreenRef.current || window.innerHeight * 0.33) / SCALE;
    pendingFailRef.current = false;
    setScore(0);
    setGameOver(false);

    //일정 쌓인 부분을 얼려버리는 함수
    const freezeOldBoxes = () => {
      const boxes = boxesRef.current;

      const settledBoxes = boxes.filter((b) => b.settled);
      if (settledBoxes.length <= 2) return;

      settledBoxes.sort(
        (a, b) => a.body.getPosition().y - b.body.getPosition().y
      );

      //const keepDynamic = settledBoxes.slice(-2);
      const freezeTargets = settledBoxes.slice(2);

      for (const box of freezeTargets) {
        if (box.frozen) continue;

        box.body.setType("static");
        box.body.setLinearVelocity(Vec2(0, 0));
        box.body.setAngularVelocity(0);
        box.body.setAwake(false);

        box.frozen = true;
      }
    };

    // 새 상자 생성 (위에서 좌우로 움직이는 kinematic 바디)
    const spawnBox = () => {
      const camY = cameraYRef.current;
      const spawnOffsetScreen =
        spawnOffsetScreenRef.current || window.innerHeight * 0.33;
      const startY = camY + spawnOffsetScreen / SCALE; // 화면 기준 스폰
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

      const speed = speedRef.current; // 점점 빨라질 값
      body.setLinearVelocity(Vec2(direction * speed, 0));

      const spriteIndex = Math.floor(Math.random() * 4); // 0~3
      const info: BoxInfo = {
        body,
        spriteIndex,
        settled: false,
        frozen: false,
      };
      boxesRef.current.push(info);
      currentBoxRef.current = { body, isDropping: false };
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

    // 상자 떨어지고 나서 안정되었는지 체크, 카메라, 무너짐 체크 등
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

      if (
        currentBoxRef.current &&
        currentBoxRef.current.isDropping &&
        !gameOverRef.current
      ) {
        const body = currentBoxRef.current.body;
        const v = body.getLinearVelocity();
        const speed = Math.sqrt(v.x * v.x + v.y * v.y);
        const angVel = body.getAngularVelocity();
        const pos = body.getPosition();
        const lastBody = lastPlacedBoxRef.current;

        // 🔹 1) 실패 예정인 경우: 충분히 떨어졌으면 그때 진짜 실패
        if (pendingFailRef.current && lastBody) {
          const worldHeight = window.innerHeight / SCALE;
          const cameraY = cameraYRef.current;
          const lastY = lastBody.getPosition().y;

          const belowStack = pos.y > lastY + BOX_SIZE * 1.2; // 스택보다 한 칸 이상 아래로 떨어짐
          const outOfView = pos.y - cameraY > worldHeight + BOX_SIZE; // 화면 아래로 완전 나감

          if (belowStack || outOfView) {
            pendingFailRef.current = false;
            currentBoxRef.current.isDropping = false;

            setGameOver(true);
            gameOverRef.current = true;
            return;
          }
        }

        // 🔹 2) 정상 케이스: 완전히 멈췄을 때만 "성공적으로 쌓였는지" 처리
        if (speed < 0.05 && Math.abs(angVel) < 0.05) {
          const pos = body.getPosition();
          dustEffectsRef.current.push({
            x: pos.x,
            y: pos.y + BOX_SIZE / 2,
            frame: 0,
            life: 1,
          });

          currentBoxRef.current.isDropping = false;

          // ❗ 실패 예정이었던 박스면, 여기서는 그냥 아무 것도 안 하고
          // 위의 "충분히 떨어졌을 때" 로직에서만 실패를 내도록 한다
          if (pendingFailRef.current) {
            // 여기서는 return만 (성공 처리 안 함)
            return;
          }

          // ✅ 여기까지 왔으면 “성공적으로 위에 올라간 것”
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

      // 🔹 카메라 위치 업데이트 (항상 타겟을 향해 부드럽게 이동)
      const lastBody = lastPlacedBoxRef.current;
      if (lastBody) {
        const lastPos = lastBody.getPosition();
        const currentCameraY = cameraYRef.current;
        const screenH = window.innerHeight;

        // 마지막 박스를 화면 높이의 80% 지점쯤에 두고 싶다 (조절 가능)
        const desiredScreenY = screenH * 0.8;

        // (lastPos.y - cameraY) * SCALE = desiredScreenY
        const rawTargetY = lastPos.y - desiredScreenY / SCALE;

        // 카메라는 0보다 아래(양수)로는 안 내려가게 – 시작 지점 고정
        const targetCameraY = Math.min(rawTargetY, 0);

        // 타겟까지의 차이
        const delta = targetCameraY - currentCameraY;

        // lerp + 한 프레임당 최대 이동량 제한
        const step = delta * CAMERA_LERP; // 부드럽게 따라가기
        const maxStep = CAMERA_MAX_STEP; // 너무 급하게 튀지 않도록 제한
        const clampedStep = Math.max(-maxStep, Math.min(maxStep, step));

        cameraYRef.current = currentCameraY + clampedStep;
      }

      // 좌우 왕복 이동 처리 (kinematic인 현재 상자)
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

      if (!gameOverRef.current) {
        for (const box of boxes) {
          if (!box.settled) continue;

          const vel = box.body.getLinearVelocity();
          const angVel = box.body.getAngularVelocity();
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

          const isStable = Math.sqrt(vel.x * vel.x + vel.y * vel.y) < 0.05;

          if(isStable){
            box.stableTime = (box.stableTime || 0) + TIME_STEP;

            if(box.stableTime > 0.8){
                box.settled = true;
            }
          }
          else {
            box.stableTime = 0;
          }

          // 아직 막 흔들리고 있는 중이면 일단 패스
          if (speed > 0.15 || Math.abs(angVel) > 0.15) continue;

          const angle = Math.abs(box.body.getAngle());
          if (angle > TILT_LIMIT) {
            setGameOver(true);
            gameOverRef.current = true;
            break;
          }
        }
      }

      // DUST 업데이트
      dustEffectsRef.current = dustEffectsRef.current.filter((d) => d.life > 0);
      for (const d of dustEffectsRef.current) {
        // 전체 수명 (1 → 0)만 관리
        d.life = Math.max(0, d.life - 0.012); // 숫자 조절해서 느리게/빠르게

        d.y -= 0.005;
      }
    };

    // 그리기
    const renderScene = (ctx: CanvasRenderingContext2D) => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      // 배경
      ctx.fillStyle = "#E0F2FE";
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      const cameraY = cameraYRef.current;

      const worldToScreen = (x: number, y: number) => {
        return {
          x: x * SCALE,
          y: (y - cameraY) * SCALE,
        };
      };

      // 땅
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

      // 🔹 가이드라인 (박스 모양, 진한 색)
      const lastBody = lastPlacedBoxRef.current;
      if (lastBody) {
        const lastPos = lastBody.getPosition();
        const guide = worldToScreen(lastPos.x, spawnYRef.current);
        const w = BOX_SIZE * SCALE;
        const h = BOX_SIZE * SCALE;

        const glow = perfectHitRef.current;

        ctx.save();
        if (glow > 0) {
          // 퍼펙트 히트 시: 노란 빛 + 두꺼운 라인
          ctx.shadowColor = `rgba(250, 204, 21, ${0.6 * glow})`; // 노란색 그림자
          ctx.shadowBlur = 25 * glow;
          ctx.lineWidth = 3 + 3 * glow;
          ctx.setLineDash([]); // 점선 대신 실선
          ctx.strokeStyle = "rgba(253, 224, 71, 1)"; // 진한 노랑
        } else {
          // 평소 가이드라인
          ctx.strokeStyle = "rgba(31,41,55,0.9)";
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
        }
        ctx.strokeRect(guide.x - w / 2, guide.y - h / 2, w, h);
        ctx.restore();
      }

      // 박스들
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

        // life: 1 → 0  ⇒ progress: 0 → 1
        const progress = 1 - d.life; // 0 ~ 1

        // progress 구간에 따라 프레임 나누기
        let frameIndex = Math.floor(progress * frames);
        if (frameIndex >= frames) frameIndex = frames - 1;

        const img = dustFramesRef.current[frameIndex];

        const { x, y } = worldToScreen(d.x, d.y);
        const size = BOX_SIZE * SCALE * 1.6;

        ctx.save();
        ctx.globalAlpha = d.life; // 서서히 투명해지는 건 그대로
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        ctx.restore();
      }
    };

    loop();

    return () => {
      if (animationId !== undefined) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      worldRef.current = null;
    };
  }, [gameStarted, resetToken]);

  const handleClick = () => {
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

    // 🔹 퍼펙트 히트 체크
    if (lastBody) {
      const currX = body.getPosition().x;
      const lastX = lastBody.getPosition().x;

      const perfectOffset = BOX_SIZE * 0.05;
      if (Math.abs(currX - lastX) <= perfectOffset) {
        perfectHitRef.current = 1;
      }

      // 🔹 너무 많이 벗어난 경우 → 바로 실패 X, “실패 예정”만 표시
      const allowedOffset = BOX_SIZE * 0.55;
      if (Math.abs(currX - lastX) > allowedOffset) {
        pendingFailRef.current = true; // 여기서 눈에 안 보이는 플래그만 세워둠
      }
    }

    body.setType("dynamic");
    body.setLinearVelocity(Vec2(0, 0));
    current.isDropping = true;
  };

  // 게임 시작 핸들러
  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
    setResetToken((v) => v + 1);
  };

  // 게임 시작 화면
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-[2vh]">
        <div className="bg-white rounded-[3vh] shadow-2xl w-full max-w-md p-[5vh] text-center">
          <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-blue-400 rounded-lg mx-auto mb-[2vh] flex items-center justify-center">
            <div className="text-white text-[7vw]">📦</div>
          </div>

          <h1 className="text-[6vw] md:text-[32px] font-bold text-gray-800 mb-[2vh]">
            상자 쌓기 게임
          </h1>

          <div className="bg-blue-50 rounded-[2vh] p-[3vh] mb-[3vh] space-y-[1.5vh]">
            <div className="flex items-center justify-center gap-[2vw]">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                상자를 무너뜨리지 않고 최대한 많이 쌓으세요!
              </p>
            </div>
            <div className="flex items-center justify-center gap-[2vw]">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                화면을 클릭하면 상자가 떨어집니다.
              </p>
            </div>
            <div className="flex items-center justify-center gap-[2vw]">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                마지막 상자와 너무 벗어나면 실패합니다.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-[2vh] bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-[2vh] font-bold text-[4.5vw] md:text-[20px] hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            게임 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer"
      onClick={handleClick}
    >
      {/* 점수 표시 */}
      <div className="absolute top-[2vh] right-[2vh] z-10 pointer-events-none">
        <div className="bg-white rounded-2xl py-[1.5vh] shadow-lg">
          <div className="text-center px-[7vw]">
            <div className="text-[4vw] text-gray-600 font-semibold">
              쌓은 상자
            </div>
            <div className="text-[5vw] font-bold text-blue-600">{score}</div>
          </div>
        </div>
      </div>

      {/* 게임 캔버스 */}
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* 게임 오버 모달 */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[4vh] w-[90%] max-w-md shadow-2xl text-center">
            <div className="text-[8vw] mb-[2vh]">💥</div>
            <h2 className="text-[5vw] font-bold text-gray-800 mb-[1vh]">
              게임 오버!
            </h2>
            <div className="text-[4vw] text-gray-600 mb-[3vh]">
              최종 점수: {score}개
            </div>
            <button
              onClick={() => {
                setGameStarted(false);
                setGameOver(false);
                setScore(0);
                if (speedRef.current) {
                  speedRef.current = 2;
                }
              }}
              className="w-full py-[2.5vh] bg-blue-500 text-white rounded-xl font-bold text-[4vw] hover:bg-blue-600 transition-colors"
            >
              다시 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoxStacking;
