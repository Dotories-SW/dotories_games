"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import LoadingSpinner from "../_component/LoadingSpinner";
import { useSearchParams } from "next/navigation";
import Matter from "matter-js";

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

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    // 화면 크기
    const width = window.innerWidth;
    const height = window.innerHeight;
    const GROUND_HEIGHT = 60;

    // 엔진 생성
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.3 },
    });

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
        render: {
          fillStyle: "#D97706", // 주황색
        },
      }
    );

    const doughnut = Matter.Bodies.circle(width / 6, height / 6, 30, {
      restitution: 0.5,
      friction: 0.005,
      density: 0.001,
      render: {
        sprite: {
            texture: "/doughnut/doughnut.png",
            xScale: 0.1,
            yScale: 0.1,
        }
      },
    });

    // 월드에 추가
    Matter.World.add(engine.world, ground);
    Matter.World.add(engine.world, doughnut);

    // 렌더러 실행
    Matter.Render.run(render);

    // 엔진 실행
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // 클린업
    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      Matter.Runner.stop(runner);
    };
  }, [gameStarted]);

  // 게임 시작
  const handleStartGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
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

          {/* 시작 버튼 */}
          <button
            onClick={handleStartGame}
            className="w-full py-[3vh] bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[2vh] font-bold text-[4.5vw] md:text-[20px] hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            게임 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 to-orange-100">
      <div ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
