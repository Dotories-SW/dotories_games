"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useSearchParams } from "next/navigation";
import Matter from "matter-js";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";

export default function DoughnutGamePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DoughnutGame />
    </Suspense>
  );
}

function DoughnutGame() {
  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : "691a90ead813df88a787f904";

  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState(""); // 게임 종료 메시지

  const canvasRef = useRef<HTMLDivElement>(null);
  const doughnutRef = useRef<Matter.Body | null>(null); // 현재 움직이는 도넛
  const stackedDoughnutsRef = useRef<Matter.Body[]>([]); // 떨어진 도넛들
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const groundRef = useRef<Matter.Body | null>(null);
  const createNewDoughnutRef = useRef<(() => Matter.Body) | null>(null);
  const currentXRef = useRef<number>(0);
  const directionRef = useRef<number>(1);
  const doughnutRadiusRef = useRef<number>(30);
  const processedDoughnutsRef = useRef<Set<Matter.Body>>(new Set()); // 이미 처리된 도넛 추적
  const apiCalledRef = useRef<boolean>(false); // API 호출 여부 추적
  const [completedGames, setCompletedGames] = useState<boolean>();

  useEffect(() => {
    const getCompleted = async () => {
      const res = await getGameCompleted(loginId);
      let data = res.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      setCompletedGames(data[3]);
    };
    getCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    // 화면 크기
    const width = window.innerWidth;
    const height = window.innerHeight;
    const GROUND_HEIGHT = height * 0.08; // 화면 높이의 8%
    
    // 화면 크기에 따른 도넛 크기 조절 (가로로 넓은 사각형)
    const baseSize = Math.min(width, height) * 0.05; // 화면 크기의 5%
    const DOUGHNUT_WIDTH = Math.max(60, Math.min(100, baseSize * 2.4)); // 가로: 더 넓게 (2.4배)
    const DOUGHNUT_HEIGHT = Math.max(25, Math.min(50, baseSize)); // 세로: 원래 크기
    const DOUGHNUT_RADIUS = DOUGHNUT_WIDTH / 2; // 호환성을 위해 반지름 계산 (사용 안 함)
    doughnutRadiusRef.current = DOUGHNUT_RADIUS;
    const MOVE_SPEED = width * 0.006; // 화면 크기에 비례한 이동 속도
    
    // 원본 이미지 크기 (일반적으로 200x200 또는 100x100, 실제 이미지 크기에 맞게 조정 필요)
    // 스프라이트 스케일은 원본 이미지 픽셀 크기에 대한 배율
    const SPRITE_IMAGE_SIZE = 200; // 원본 도넛 이미지의 픽셀 크기 (가정)

    // 엔진 생성 (기본 중력, 높이에 따라 조절됨)
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.2 }, // 기본 중력 (더 빠르게 떨어지도록 증가)
    });
    engineRef.current = engine;

    // 렌더러 생성
    const render = Matter.Render.create({
      element: canvasRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "transparent",
      },
    });
    

    // 바닥 생성
    const ground = Matter.Bodies.rectangle(
      width / 2,
      height - GROUND_HEIGHT / 2,
      width,
      GROUND_HEIGHT,
      {
        isStatic: true,
        restitution: 0.2, // 약간 튕기도록 (자연스러운 쌓임)
        friction: 1.5, // 적절한 마찰력
        render: {
          fillStyle: "#D97706", // 주황색
        },
        label: "ground",
      }
    );
    groundRef.current = ground;

    // 새로운 도넛 생성 함수
    const initialY = height / 3; // y 위치 통일

    // moveInterval 함수 (재사용 가능하도록)
    const startMoveInterval = () => {
      // 기존 interval이 있으면 제거
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }

      // currentX와 direction 초기화
      currentXRef.current = width / 2;
      directionRef.current = 1;

      const moveInterval = setInterval(() => {
        if (!doughnutRef.current || !doughnutRef.current.isStatic) return;

        // 이동
        currentXRef.current += directionRef.current * MOVE_SPEED;

        // 화면 끝에 닿으면 방향 전환
        if (currentXRef.current <= DOUGHNUT_WIDTH / 2) {
          currentXRef.current = DOUGHNUT_WIDTH / 2;
          directionRef.current = 1; // 오른쪽으로
        } else if (currentXRef.current >= width - DOUGHNUT_WIDTH / 2) {
          currentXRef.current = width - DOUGHNUT_WIDTH / 2;
          directionRef.current = -1; // 왼쪽으로
        }

        // 도넛 위치 업데이트
        if (doughnutRef.current) {
          Matter.Body.setPosition(doughnutRef.current, {
            x: currentXRef.current,
            y: initialY, // y는 고정
          });
        }
      }, 16); // 약 60fps

      moveIntervalRef.current = moveInterval;
    };

    const createNewDoughnut = () => {
      // currentX와 direction 초기화
      currentXRef.current = width / 2;
      directionRef.current = 1;

      const newDoughnut = Matter.Bodies.rectangle(
        currentXRef.current,
        initialY,
        DOUGHNUT_WIDTH,
        DOUGHNUT_HEIGHT,
        {
          isStatic: true, // 고정 상태
          restitution: 0.2, // 약간 튕기도록 (자연스러운 쌓임)
          friction: 1.2, // 적절한 마찰력
          density: 0.001, // 가벼움
          frictionAir: 0.01,
          render: {
            sprite: {
              texture: "/doughnut/doughnut.png",
              xScale: DOUGHNUT_WIDTH / SPRITE_IMAGE_SIZE * 1.2, // 물리 크기(픽셀) / 원본 이미지 크기
              yScale: DOUGHNUT_HEIGHT / SPRITE_IMAGE_SIZE * 2.4, // 물리 크기(픽셀) / 원본 이미지 크기
            },
          },
          label: "movingDoughnut",
        }
      );

      doughnutRef.current = newDoughnut;
      Matter.World.add(engine.world, newDoughnut);

      // 위치를 명시적으로 설정
      Matter.Body.setPosition(newDoughnut, {
        x: currentXRef.current,
        y: initialY,
      });

      // moveInterval 다시 시작 (새 도넛 추적)
      startMoveInterval();

      return newDoughnut;
    };

    createNewDoughnutRef.current = createNewDoughnut;

    // 첫 도넛 생성
    createNewDoughnut();

    // 월드에 추가
    Matter.World.add(engine.world, ground);

    // 렌더러 실행
    Matter.Render.run(render);

    // 엔진 실행
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // 충돌 감지 - 도넛이 바닥이나 마지막 쌓인 도넛에 닿으면
    Matter.Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // 떨어지는 도넛이 바닥이나 쌓인 도넛과 충돌
        if (
          bodyA.label === "movingDoughnut" ||
          bodyB.label === "movingDoughnut"
        ) {
          const fallingDoughnut =
            bodyA.label === "movingDoughnut" ? bodyA : bodyB;
          const otherBody = bodyA.label === "movingDoughnut" ? bodyB : bodyA;

          // 이미 처리된 도넛은 무시
          if (processedDoughnutsRef.current.has(fallingDoughnut)) {
            return;
          }

          // 떨어지는 도넛이 아직 static이 아니어야 함
          if (fallingDoughnut.isStatic) {
            return;
          }

          const isFirstDoughnut = stackedDoughnutsRef.current.length === 0;
          const lastStackedDoughnut =
            stackedDoughnutsRef.current[stackedDoughnutsRef.current.length - 1];

          // 무너짐 조건 2: 도넛이 쌓여있는 상태에서, 새로운 도넛이 바닥과 충돌한 경우
          if (!isFirstDoughnut && otherBody === ground) {
            // 이미 쌓인 도넛이 있는데 바닥과 충돌하면 게임 오버
            if (!gameOver) {
              setGameMessage("💥 도넛이 무너졌습니다!");
              setGameOver(true);
            }
            return;
          }

          // 첫 번째 도넛은 바닥과, 나머지는 마지막 쌓인 도넛과만 충돌해야 함
          const isValidCollision = isFirstDoughnut
            ? otherBody === ground
            : lastStackedDoughnut && otherBody === lastStackedDoughnut;

          if (isValidCollision) {
            // 즉시 처리 표시 (중복 방지)
            processedDoughnutsRef.current.add(fallingDoughnut);

            // 떨어진 도넛을 리스트에 추가 (먼저 추가해서 lastStackedDoughnut가 올바르게 작동)
            stackedDoughnutsRef.current.push(fallingDoughnut);
            doughnutRef.current = null;

            // label 변경 (다음 충돌 감지에서 구분하기 위해)
            fallingDoughnut.label = "stackedDoughnut";

            // 첫 번째 도넛은 물리력 없이 바로 고정, 두 번째부터는 물리력 적용
            if (isFirstDoughnut) {
              // 첫 번째 도넛: 바로 고정 (물리력 없음)
              Matter.Body.setStatic(fallingDoughnut, true);
              Matter.Body.setVelocity(fallingDoughnut, { x: 0, y: 0 });
              Matter.Body.setAngularVelocity(fallingDoughnut, 0);
              
              // 첫 번째 도넛은 점수 증가 후 새 도넛 생성 (안정화 체크 없음)
              setScore(stackedDoughnutsRef.current.length);
              
              setTimeout(() => {
                if (
                  !gameOver &&
                  engineRef.current &&
                  createNewDoughnutRef.current
                ) {
                  createNewDoughnutRef.current();
                }
              }, 500);
              
              return; // 첫 번째 도넛은 여기서 종료
            } else {
              // 두 번째 도넛부터: 물리력을 적용하여 안정화 대기
              // 자연스러운 쌓임을 위한 물리 속성 조정
              fallingDoughnut.friction = 1.5; // 적절한 마찰력
              fallingDoughnut.restitution = 0.2; // 약간 튕기도록
              Matter.Body.setDensity(fallingDoughnut, 0.001);
              fallingDoughnut.frictionAir = 0.05; // 적절한 공기 저항
              // inertia를 높여서 회전을 줄임 (안정적이지만 너무 딱딱하지 않게)
              Matter.Body.setInertia(fallingDoughnut, 10000);
            }

            // 속도 감소 (충돌 후 안정화) - 두 번째 도넛부터만
            Matter.Body.setVelocity(fallingDoughnut, {
              x: fallingDoughnut.velocity.x * 0.1,
              y: fallingDoughnut.velocity.y * 0.1,
            });
            Matter.Body.setAngularVelocity(
              fallingDoughnut,
              fallingDoughnut.angularVelocity * 0.1
            );

            // 연속적으로 안정화 상태를 체크 (여러 번 검증) - 두 번째 도넛부터만
            let stableCheckCount = 0;
            const requiredStableChecks = 3; // 연속 3번 안정화 상태여야 고정

            const checkStability = () => {
              if (!fallingDoughnut || gameOver) return;

              const checkAngle = fallingDoughnut.angle;
              let checkNormalized = checkAngle % (2 * Math.PI);
              if (checkNormalized < 0) checkNormalized += 2 * Math.PI;
              const checkAngleDegrees = Math.abs(
                checkNormalized * (180 / Math.PI)
              );
              const checkAngleFromZero = Math.min(
                checkAngleDegrees,
                360 - checkAngleDegrees
              );

              const checkSpeed = Math.sqrt(
                fallingDoughnut.velocity.x * fallingDoughnut.velocity.x +
                  fallingDoughnut.velocity.y * fallingDoughnut.velocity.y
              );

              const checkAngularSpeed = Math.abs(
                fallingDoughnut.angularVelocity
              );

              // 불안정한 상태(20도 이상)이면 즉시 게임 오버 (빠르게 감지)
              if (
                checkAngleFromZero > 20 ||
                checkSpeed > 1.0 ||
                checkAngularSpeed > 0.5
              ) {
                if (!gameOver) {
                  setGameMessage("💥 도넛이 무너졌습니다!");
                  setGameOver(true);
                }
                return;
              }
              // 안정화되었는지 체크 (10도 이하, 속도 매우 낮음 - 더 엄격하게)
              else if (
                checkAngleFromZero <= 10 &&
                checkSpeed < 0.2 &&
                checkAngularSpeed < 0.2
              ) {
                stableCheckCount++;
                // 연속 3번 안정화 상태면 고정
                if (stableCheckCount >= requiredStableChecks) {
                  Matter.Body.setStatic(fallingDoughnut, true);
                  Matter.Body.setInertia(fallingDoughnut, Infinity);
                  Matter.Body.setVelocity(fallingDoughnut, { x: 0, y: 0 });
                  Matter.Body.setAngularVelocity(fallingDoughnut, 0);
                  return;
                }
              } else {
                // 안정화 상태가 아니면 카운터 리셋
                stableCheckCount = 0;
              }

              // 0.5초마다 체크 (총 3초 동안 검증)
              if (stableCheckCount < requiredStableChecks) {
                setTimeout(checkStability, 500);
              }
            };

            // 1초 후부터 검증 시작
            setTimeout(checkStability, 1000);

            // 점수 증가
            setScore(stackedDoughnutsRef.current.length);

            // 새로운 도넛 생성 (검증 시간과 비슷하게 - 2.5초 후)
            // 1초 후 검증 시작 + 최대 1.5초 검증 = 총 2.5초
            setTimeout(() => {
              if (
                !gameOver &&
                engineRef.current &&
                createNewDoughnutRef.current
              ) {
                createNewDoughnutRef.current();
                // createNewDoughnut에서 moveInterval을 다시 시작해서 새 도넛을 추적함
              }
            }, 2000);

            // 5개 쌓였는지 검증 시간 후에 확인 (5번째 도넛도 떨어질 수 있으므로)
            // 검증 시간: 1초 + 최대 1.5초 = 2.5초 후에 성공 검증
            setTimeout(() => {
              if (
                !gameOver &&
                stackedDoughnutsRef.current.length >= 5 &&
                !apiCalledRef.current
              ) {
                // 모든 도넛이 고정되어 있는지 확인
                const allStable = stackedDoughnutsRef.current.every(
                  (doughnut) => doughnut && doughnut.isStatic
                );

                if (allStable) {
                  setGameMessage("🎉 성공! 5개를 모두 쌓았습니다!");
                  setGameOver(true);
                  // 이미 완료된 게임이 아니고, 아직 API 호출을 하지 않았을 때만 호출
                  if (!apiCalledRef.current && !completedGames) {
                    apiCalledRef.current = true;
                    patchCompletedGame(loginId, 3, true);
                    setCompletedGames(true);
                  }
                }
              }
            }, 2000);
          }
        }
      });
    });

    // 도넛 무너짐 감지 및 높이에 따른 중력 조절
    Matter.Events.on(engine, "afterUpdate", () => {
      if (gameOver) return;

      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const groundY = currentHeight - GROUND_HEIGHT;
      
      // 떨어지는 도넛의 높이에 따라 중력 조절
      if (doughnutRef.current && !doughnutRef.current.isStatic) {
        // 모든 도넛은 중력 받음
        const fallingY = doughnutRef.current.position.y;
        const availableHeight = currentHeight - groundY;
        const heightFromGround = fallingY - groundY;
        const heightRatio = Math.max(0, Math.min(1, heightFromGround / availableHeight));
        // 높을수록 중력 증가 (최소 1.2, 최대 2.0)
        // heightRatio가 1에 가까울수록 (높을수록) 중력이 커짐
        const dynamicGravity = 1.2 + heightRatio * 0.8;
        engine.gravity.y = dynamicGravity;
      } else {
        // 떨어지는 도넛이 없으면 기본 중력
        engine.gravity.y = 1.2;
      }

      // 쌓인 도넛들이 무너졌는지 체크
      stackedDoughnutsRef.current.forEach((doughnut) => {
        if (!doughnut || !doughnut.position) return;

        const pos = doughnut.position;
        const velocity = doughnut.velocity;
        const angle = doughnut.angle; // 각도 체크 (라디안)

        // 각도를 0~360도 범위로 정규화
        let normalizedAngle = angle % (2 * Math.PI);
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
        const angleDegrees = Math.abs(normalizedAngle * (180 / Math.PI));
        // 0도 또는 360도에 가까운 각도는 0도로 간주
        const angleFromZero = Math.min(angleDegrees, 360 - angleDegrees);

        // 화면 밖으로 나갔거나 위치가 이상하면 게임 오버
        if (
          pos.y > currentHeight + 50 ||
          pos.x < -50 ||
          pos.x > currentWidth + 50 ||
          isNaN(pos.x) ||
          isNaN(pos.y)
        ) {
          if (!gameOver) {
            setGameMessage("💥 도넛이 무너졌습니다!");
            setGameOver(true);
            return;
          }
        }

        // 쌓인 도넛이 바닥보다 훨씬 아래로 가면 무너진 것
        if (pos.y > groundY + 100) {
          if (!gameOver) {
            setGameMessage("💥 도넛이 무너졌습니다!");
            setGameOver(true);
            return;
          }
        }

        // 고정되지 않은 도넛의 물리 속성 조정
        if (!doughnut.isStatic) {
          // 불안정한 상태(20도 이상)일 때는 중력의 영향을 더 받도록
          if (angleFromZero > 20) {
            doughnut.friction = 0.3; // 마찰력 대폭 감소 (빠르게 떨어지도록)
            doughnut.frictionAir = 0.005; // 공기 저항 대폭 감소 (빠르게 떨어지도록)
            doughnut.restitution = 0;
            // 밀도를 높여서 중력의 영향을 더 받도록
            Matter.Body.setDensity(doughnut, 0.005); // 밀도 증가 (중력 영향 증가)
          } else {
            // 안정적인 상태일 때는 적절한 마찰력 유지
            doughnut.friction = 1.5; // 적절한 마찰력
            doughnut.restitution = 0.2; // 약간 튕기도록
            doughnut.frictionAir = 0.05; // 적절한 공기 저항
            Matter.Body.setDensity(doughnut, 0.001); // 밀도 낮게 유지
          }
        }

        // 도넛이 진짜 넘어져야 할 정도로 기울어졌으면 무너진 것
        // 45도 이상 기울어지면 무너진 것으로 간주 (60% 닿을 때 - 물리력 덜 예민하게)
        if (angleFromZero > 45) {
          if (!gameOver) {
            setGameMessage("💥 도넛이 무너졌습니다!");
            setGameOver(true);
            return;
          }
        }

        // 고정되지 않은 도넛이 20도 이상 기울어지고 떨어지고 있으면 게임 오버
        // (중력의 영향을 받아 떨어지는 것을 감지)
        if (!doughnut.isStatic && angleFromZero > 20) {
          const speed = Math.sqrt(
            velocity.x * velocity.x + velocity.y * velocity.y
          );
          // 기울어지고 떨어지고 있으면 (속도가 있으면) 게임 오버
          if (speed > 0.2) {
            if (!gameOver) {
              setGameMessage("💥 도넛이 무너졌습니다!");
              setGameOver(true);
              return;
            }
          }
        }

        // 쌓인 도넛이 진짜 떨어질 정도로 빠르게 움직이면 무너진 것
        // 속도가 2.0 이상이면 움직이는 것으로 간주 (물리력 덜 예민하게)
        const speed = Math.sqrt(
          velocity.x * velocity.x + velocity.y * velocity.y
        );
        if (speed > 2.0) {
          if (!gameOver) {
            setGameMessage("💥 도넛이 무너졌습니다!");
            setGameOver(true);
            return;
          }
        }

        // 각속도가 진짜 회전할 정도로 크면 무너진 것
        const angularSpeed = Math.abs(doughnut.angularVelocity);
        if (angularSpeed > 1.5) {
          if (!gameOver) {
            setGameMessage("💥 도넛이 무너졌습니다!");
            setGameOver(true);
            return;
          }
        }
      });

      // 쌓인 도넛들이 서로 너무 멀리 떨어져 있으면 무너진 것으로 간주
      if (stackedDoughnutsRef.current.length >= 2) {
        for (let i = 0; i < stackedDoughnutsRef.current.length - 1; i++) {
          const doughnut1 = stackedDoughnutsRef.current[i];
          const doughnut2 = stackedDoughnutsRef.current[i + 1];

          if (
            !doughnut1 ||
            !doughnut2 ||
            !doughnut1.position ||
            !doughnut2.position
          )
            continue;

          const dx = doughnut2.position.x - doughnut1.position.x;
          const dy = doughnut2.position.y - doughnut1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 도넛 너비의 1.5배 이상 떨어져 있으면 무너진 것으로 간주
          if (distance > DOUGHNUT_WIDTH * 1.5) {
            if (!gameOver) {
              setGameMessage("💥 도넛이 무너졌습니다!");
              setGameOver(true);
              return;
            }
          }
        }
      }

      // 떨어지는 도넛도 체크
      if (doughnutRef.current && !doughnutRef.current.isStatic) {
        const pos = doughnutRef.current.position;

        if (
          pos.y > currentHeight + 50 ||
          pos.x < -50 ||
          pos.x > currentWidth + 50 ||
          isNaN(pos.x) ||
          isNaN(pos.y)
        ) {
          if (!gameOver) {
            setGameMessage("💥 도넛이 무너졌습니다!");
            setGameOver(true);
          }
        }
      }

      // 5개가 모두 쌓이고 고정되었는지 주기적으로 체크 (API 호출은 하지 않음)
      if (stackedDoughnutsRef.current.length >= 5 && !gameOver) {
        const allStable = stackedDoughnutsRef.current.every(
          (doughnut) => doughnut && doughnut.isStatic
        );

        if (allStable) {
          setGameMessage("🎉 성공! 5개를 모두 쌓았습니다!");
          setGameOver(true);
          // API 호출은 setTimeout에서만 수행
        }
      }
    });

    // moveInterval은 createNewDoughnut에서 시작됨

    // 클린업
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      Matter.Runner.stop(runner);
      doughnutRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // 게임 시작
  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
    setGameMessage("");
    stackedDoughnutsRef.current = [];
    processedDoughnutsRef.current.clear();
    apiCalledRef.current = false; // API 호출 플래그 리셋
  };

  // 게임 시작 화면
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-[2vh]">
        <div className="bg-white rounded-[3vh] shadow-2xl w-full max-w-md p-[5vh] text-center">
          <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-orange-400 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
            <div className="text-white text-[7vw]">🍩</div>
          </div>

          {/* 게임 제목 */}
          <h1 className="text-[6vw] md:text-[32px] font-bold text-gray-800 mb-[2vh]">
            도넛 쌓기 게임
          </h1>

          {/* 게임 설명 */}
          <div className="bg-orange-50 rounded-[2vh] p-[3vh] mb-[3vh] space-y-[1.5vh]">
            <div className="flex items-center justify-center gap-[2vw]">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                도넛을 무너뜨리지 않고, 5개를 쌓으면 성공!
              </p>
            </div>
            <div className="flex items-center justify-center gap-[2vw]">
              <p className="text-[3.5vw] md:text-[16px] text-gray-700">
                화면을 클릭하면 도넛이 떨어집니다.
              </p>
            </div>
          </div>

          {completedGames && (
            <div className="text-[3.5vw] text-gray-700 mb-[2vh] font-semibold">
              오늘 클리어 하여 게임 진행은 가능하지만, <br /> 코인은 제공되지
              않습니다.
            </div>
          )}
          {/* 시작 버튼 */}
          <button
            onClick={handleStartGame}
            className="w-full py-[2vh] bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[2vh] font-bold text-[4.5vw] md:text-[20px] hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            게임 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 클릭 핸들러 - 도넛 떨어뜨리기
  const handleClick = () => {
    if (
      gameOver ||
      !doughnutRef.current ||
      !doughnutRef.current.isStatic ||
      !engineRef.current
    )
      return;

    // moveInterval 멈추기
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }

    // 현재 위치 저장
    const currentX = doughnutRef.current.position.x;
    const currentY = doughnutRef.current.position.y;

    // 기존 도넛 제거
    const oldDoughnut = doughnutRef.current;
    Matter.World.remove(engineRef.current.world, oldDoughnut);
    doughnutRef.current = null;

    // 첫 번째 도넛인지 확인
    const isFirstDoughnut = stackedDoughnutsRef.current.length === 0;
    
    // 같은 위치에 새로운 동적 도넛 생성 (떨어지는 도넛)
    // 도넛 크기 계산 (useEffect 외부이므로 현재 화면 크기로 계산)
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const baseSize = Math.min(currentWidth, currentHeight) * 0.05;
    const doughnutWidth = Math.max(60, Math.min(100, baseSize * 2.4));
    const doughnutHeight = Math.max(25, Math.min(50, baseSize));
    
    const fallingDoughnut = Matter.Bodies.rectangle(
      currentX,
      currentY,
      doughnutWidth,
      doughnutHeight,
      {
        isStatic: false, // 동적 상태
        restitution: 0.2, // 약간 튕기도록 (자연스러운 쌓임)
        friction: isFirstDoughnut ? 0 : 1.2, // 첫 번째 도넛은 마찰력 없음
        density: 0.001, // 모든 도넛은 중력 받음
        frictionAir: isFirstDoughnut ? 0 : 0.01, // 첫 번째 도넛은 공기 저항 없음
        // inertia: Infinity 제거 - 좌우 이동 허용
        render: {
          sprite: {
            texture: "/doughnut/doughnut.png",
            xScale: doughnutWidth / 200 * 1.2, // 물리 크기(픽셀) / 원본 이미지 크기
            yScale: doughnutHeight / 200 * 2.4, // 물리 크기(픽셀) / 원본 이미지 크기
          },
        },
        label: "movingDoughnut", // 충돌 감지용
      }
    );

    // 월드에 추가
    Matter.World.add(engineRef.current.world, fallingDoughnut);

    // 속도 초기화 (위치는 이미 설정됨)
    Matter.Body.setVelocity(fallingDoughnut, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(fallingDoughnut, 0);
  };

  // 게임 화면
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer"
      onClick={handleClick}
    >
      {/* 점수 표시 */}
      <div className="absolute top-[2vh] left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white rounded-2xl py-[2vh] shadow-lg">
          <div className="text-center px-[7vw]">
            <div className="text-[4vw] text-gray-600 mb-[0.5vh] font-semibold">
              쌓은 도넛
            </div>
            <div className="text-[5vw] font-bold text-orange-600">
              {score} / 5
            </div>
          </div>
        </div>
      </div>

      {/* 게임 캔버스 */}
      <div ref={canvasRef} className="w-full h-full" />

      {/* 게임 오버/성공 모달 */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[4vh] w-[90%] max-w-md shadow-2xl text-center">
            <div className="text-[8vw] mb-[2vh]">
              {score >= 5 ? "🎉" : "💥"}
            </div>
            <h2 className="text-[5vw] font-bold text-gray-800 mb-[1vh]">
              {gameMessage}
            </h2>
            <div className="text-[4vw] text-gray-600 mb-[3vh]">
              최종 점수: {score} / 5
            </div>
            <button
              onClick={() => {
                setGameStarted(false);
                setGameOver(false);
                setScore(0);
                setGameMessage("");
              }}
              className="w-full py-[2.5vh] bg-orange-500 text-white rounded-xl font-bold text-[4vw] hover:bg-orange-600 transition-colors"
            >
              다시 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
