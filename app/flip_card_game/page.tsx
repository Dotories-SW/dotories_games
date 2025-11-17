"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import data from "@/public/flip_card_game.json";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";
import LoadingSpinner from "../_component/LoadingSpinner";

// 타입 정의
interface Card {
  id: number;
  name: string;
  src: string;
}

interface GameData {
  backImage: string;
  cards: Card[];
  difficulty: {
    easy: number;
    normal: number;
    hard: number;
  };
}

export default function FlipCardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FlipCardGame />
    </Suspense>
  );
}

function FlipCardGame() {
  const gameData = data as GameData;
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [gameCards, setGameCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false); // 안내 모달
  const [showingCards, setShowingCards] = useState(false); // 카드 보여주기
  const [countdown, setCountdown] = useState(5); // 카운트다운
  const [moveCount, setMoveCount] = useState(0);

  const gameBgmRef = useRef<HTMLAudioElement | null>(null);
  const [completedGames, setCompletedGames] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  // Audio 초기화
  useEffect(() => {
    gameBgmRef.current = new Audio("/sounds/flip_card/flip_card_bgm.mp3");
    gameBgmRef.current.loop = true;
    gameBgmRef.current.volume = 0.3;

    return () => {
      if (gameBgmRef.current) {
        gameBgmRef.current.pause();
        gameBgmRef.current = null;
      }
    };
  }, []);

  // 난이도별 설정
  const DIFFICULTY_CONFIGS = {
    easy: {
      name: "쉬움",
      pairs: 4,
      cards: 8,
      coin: 5,
      localIndex: 0,
      backendIndex: 7,
    },
    normal: {
      name: "보통",
      pairs: 8,
      cards: 16,
      coin: 8,
      localIndex: 1,
      backendIndex: 8,
    },
    hard: {
      name: "어려움",
      pairs: 12,
      cards: 24,
      coin: 12,
      localIndex: 2,
      backendIndex: 9,
    },
  };

  const params = useSearchParams();
  const loginId: string = params.get("loginId")
    ? (params.get("loginId") as string)
    : "691a90ead813df88a787f905";

  useEffect(() => {
    const getCompleted = async () => {
      const res = await getGameCompleted(loginId);
      let data = res.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      setCompletedGames([
        data[DIFFICULTY_CONFIGS.easy.backendIndex],
        data[DIFFICULTY_CONFIGS.normal.backendIndex],
        data[DIFFICULTY_CONFIGS.hard.backendIndex],
      ]);
    };
    getCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDifficultySelect]);

  const completedGame = async (
    loginId: string,
    index: number,
    completed: boolean
  ) => {
    try {
      await patchCompletedGame(loginId, index, completed);
    } catch (error) {
      console.error("게임 완료 업데이트 실패:", error);
    }
  };

  // 카드 섞기 함수
  const shuffleCards = (cards: Card[]) => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 게임 시작
  const startGameWithDifficulty = (difficulty: string) => {
    const pairCount =
      gameData.difficulty[difficulty as keyof typeof gameData.difficulty];
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
    setShowPrepareModal(true); // 먼저 안내 모달 표시
    setShowingCards(false);
    setCountdown(3);
    setMoveCount(0);
  };

  // 안내 모달 표시 후 카드 보여주기 시작
  useEffect(() => {
    if (showPrepareModal) {
      const timer = setTimeout(() => {
        setShowPrepareModal(false);
        setShowingCards(true); // 카드 보여주기 시작
        setCountdown(5); // 카운트다운 초기화
      }, 1500); // 1.5초 후 모달 닫기
      return () => clearTimeout(timer);
    }
  }, [showPrepareModal]);

  // 카운트다운 및 카드 숨기기 로직
  useEffect(() => {
    if (showingCards && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showingCards && countdown === 0) {
      setShowingCards(false);
    }
  }, [showingCards, countdown]);

  // 카드 클릭 처리
  const handleCardClick = (cardId: number) => {
    // 미리보기 중이거나, 이미 뒤집힌 카드거나, 매칭된 카드거나, 체크 중이면 무시
    if (
      showingCards ||
      flippedCards.includes(cardId) ||
      matchedCards.includes(cardId) ||
      isChecking ||
      flippedCards.length >= 2
    ) {
      return;
    }

    // 조건을 통과한 경우에만 오디오 재생
    const flipCardEffect = new Audio("/sounds/flip_card/flip_card_effect.mp3");
    flipCardEffect.play();

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // 두 장을 선택했을 때
    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [firstId, secondId] = newFlipped;
      const firstCard = gameCards.find((c) => c.id === firstId);
      const secondCard = gameCards.find((c) => c.id === secondId);

      // 같은 카드인지 확인 (name으로 비교)
      if (firstCard?.name === secondCard?.name) {
        // 매칭 성공
        setMatchedCards([...matchedCards, firstId, secondId]);
        setFlippedCards([]);
        setIsChecking(false);
      } else {
        // 매칭 실패 - 1초 후 다시 뒤집기
        setTimeout(() => {
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
      setMoveCount((prev) => prev + 1);
    }
  };

  // 게임 완료 체크
  useEffect(() => {
    if (gameCards.length > 0 && matchedCards.length === gameCards.length) {
      setTimeout(() => {
        setGameCompleted(true);
      }, 500);
    }
  }, [matchedCards, gameCards]);

  // 카드가 뒤집혀있는지 확인
  const isCardFlipped = (cardId: number) => {
    return (
      showingCards ||
      flippedCards.includes(cardId) ||
      matchedCards.includes(cardId)
    );
  };

  // 난이도 선택 화면
  if (showDifficultySelect) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5F1E8" }}>
        <style jsx global>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
          }
        `}</style>

        <div className="w-[90%] max-w-2xl mx-auto p-[2vh]">
          {/* 헤더 */}
          <div className="bg-white rounded-3xl p-[3vh] mb-[3vh] shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-red-400 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
                <div className="text-white text-[7vw]">🎴</div>
              </div>
              <h1 className="text-[6vw] font-bold text-gray-800 mb-[1vh]">
                카드 뒤집기 게임
              </h1>
              <p className="text-gray-600 text-[3.5vw] mb-[0.5vh]">
                같은 그림을 찾아서
              </p>
              <p className="text-gray-600 text-[3.5vw]">카드를 매칭해보세요!</p>
            </div>

            {/* 난이도 선택 */}
            <div className="mt-[3vh]">
              <h2 className="text-[3.5vw] font-bold text-gray-800 text-center mb-[2vh]">
                난이도 선택
              </h2>
              <div className="space-y-[1.5vh]">
                {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={`w-full p-[2vh] rounded-2xl transition-all ${
                      selectedDifficulty === key
                        ? "bg-red-400 border-2 border-red-400"
                        : completedGames[config.localIndex]
                        ? "border-2 border-[#6ead79]"
                        : "bg-white border-2 border-gray-300 hover:border-gray-400"
                    } shadow-sm hover:shadow-md`}
                  >
                    <div className="text-center">
                      <div
                        className={`font-bold text-[4vw] ${
                          selectedDifficulty === key
                            ? "text-white"
                            : completedGames[config.localIndex]
                            ? "text-[#6ead79]"
                            : "text-gray-800"
                        }`}
                      >
                        {config.name}
                      </div>
                      <div
                        className={`text-[3vw] ${
                          selectedDifficulty === key
                            ? "text-white"
                            : completedGames[config.localIndex]
                            ? "text-[#6ead79]"
                            : "text-gray-600"
                        }`}
                      >
                        {completedGames[config.localIndex] ? (
                          <span className="text-[2.5vw]">
                            게임 진행은 가능하지만, 코인은 제공되지 않습니다.
                          </span>
                        ) : (
                          `${config.pairs}쌍 (${config.cards}장)`
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-orange-600 font-semibold mt-[1vh]">
                      <span className="text-[3.5vw]">🪙</span>
                      <span
                        className={`text-[3.5vw] ${
                          selectedDifficulty === key
                            ? "text-white"
                            : completedGames[config.localIndex]
                            ? "text-[#6ead79]"
                            : "text-red-400"
                        }`}
                      >
                        {config.coin}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 게임 시작 버튼 */}
              <div className="mt-[3vh]">
                <button
                  onClick={() =>
                    startGameWithDifficulty(selectedDifficulty as string)
                  }
                  className={`w-[90%] mx-auto block py-[2vh] rounded-full font-bold text-[3.5vw] transition-colors shadow-lg ${
                    selectedDifficulty
                      ? "bg-red-400 text-white hover:bg-red-500"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  게임 시작
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 게임 완료 화면
  if (gameCompleted) {
    if (gameBgmRef.current) {
      gameBgmRef.current.pause();
    }
    completedGame(
      loginId,
      DIFFICULTY_CONFIGS[selectedDifficulty as keyof typeof DIFFICULTY_CONFIGS]
        .backendIndex,
      true
    );
    alert("카드뒤집기 게임완료");
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[2vh]"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-[4vh] rounded-2xl shadow-2xl text-center w-[90%] max-w-2xl">
          <div className="text-[10vw] mb-[2vh]">🎉</div>
          <h2 className="text-[5vw] font-bold text-gray-800 mb-[2vh]">완료!</h2>
          <p className="text-[3vw] mb-[3vh] text-gray-600">
            모든 카드를 매칭했습니다!
          </p>
          <p className="text-[3vw] mb-[3vh] text-gray-600">
            시도 횟수 : {moveCount}
          </p>
          <div className="space-y-[1.5vh]">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors font-semibold"
            >
              다른 난이도 선택
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 게임 화면
  const gridCols = 4; // 모든 난이도 4열로 통일
  const maxWidth =
    gameCards.length === 8
      ? "min(90vw, 500px)"
      : gameCards.length === 16
      ? "min(90vw, 600px)"
      : "min(90vw, 700px)"; // vw 단위로 반응형
  const cardGap = gameCards.length === 24 ? "gap-[0.5vw]" : "gap-[1vw]"; // 어려움은 간격도 좁게

  return (
    <div
      className="min-h-screen p-[2vh] relative"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }
        .flip-card {
          perspective: 1000px;
          position: relative;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* 안내 모달 */}
      {showPrepareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-[4vh] mx-[2vw] w-[80%] max-w-md text-center shadow-2xl animate-pulse">
            <div className="text-[10vw] mb-[2vh]">🎴</div>
            <p className="text-[3.5vw] text-gray-600 mb-[1vh]">
              먼저 카드를 보고
            </p>
            <p className="text-[3.5vw] text-gray-600">위치를 기억하세요!</p>
          </div>
        </div>
      )}

      {/* 카운트다운 오버레이 (투명 배경) */}
      {showingCards && countdown > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-[15vw] font-bold text-red-400 opacity-80 animate-bounce drop-shadow-2xl">
            {countdown}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto flex justify-center items-center min-h-screen">
        {/* 카드 그리드 */}
        <div
          className={`grid ${cardGap}`}
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            maxWidth: maxWidth,
            width: "100%",
          }}
        >
          {gameCards.map((card) => (
            <div
              key={card.id}
              className={`flip-card ${
                isCardFlipped(card.id) ? "flipped" : ""
              } cursor-pointer`}
              style={{ aspectRatio: "1 / 1.51" }}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="flip-card-inner">
                {/* 앞면 (뒷면 이미지) */}
                <div className="flip-card-front">
                  <Image
                    src={gameData.backImage}
                    alt="back"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flip-card-back bg-white">
                  <Image
                    fill
                    src={card.src}
                    alt={card.name}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[5vh]"></div>
    </div>
  );
}
