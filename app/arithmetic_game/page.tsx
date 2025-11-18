"use client";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { getGameCompleted, patchCompletedGame } from "../_api/gameApi";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "../_component/LoadingSpinner";

interface Question {
  text: string;
  answer: number;
  choices: number[];
}

type Difficulty = "easy" | "normal" | "hard";

export default function ArithmeticPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ArithmeticGame />
    </Suspense>
  );
}

function ArithmeticGame() {
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [previousAnswer, setPreviousAnswer] = useState<number | null>(null);
  const [inCorrectCount, setInCorrectCount] = useState<number>(0);

  const MAX_QUESTIONS = 10;
  const [completedGames, setCompletedGames] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  // 난이도별 설정
  const DIFFICULTY_CONFIGS = {
    easy: {
      name: "쉬움",
      description: "덧셈, 뺄셈",
      coin: 5,
      localIndex: 0,
      backendIndex: 0,
    },
    normal: {
      name: "보통",
      description: "사칙연산",
      coin: 8,
      localIndex: 1,
      backendIndex: 1,
    },
    hard: {
      name: "어려움",
      description: "연속 계산",
      coin: 12,
      localIndex: 2,
      backendIndex: 2,
    },
  };

  const params = useSearchParams();
  const loginId: string = params.get("id")
    ? (params.get("id") as string)
    : "691a90ead813df88a787f904";

  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const failSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    successSoundRef.current = new Audio("/sounds/arithmetic/success.mp3");
    failSoundRef.current = new Audio("/sounds/arithmetic/fail.mp3");

    return () => {
      if (successSoundRef.current) {
        successSoundRef.current.pause();
        successSoundRef.current = null;
      }
      if (failSoundRef.current) {
        failSoundRef.current.pause();
        failSoundRef.current = null;
      }
    };
  }, []);

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

  // 랜덤 숫자 생성
  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // 약수 구하기 (나눗셈용)
  const getDivisors = (num: number): number[] => {
    const divisors: number[] = [];
    for (let i = 2; i <= Math.min(num, 9); i++) {
      if (num % i === 0) {
        divisors.push(i);
      }
    }
    return divisors.length > 0 ? divisors : [2]; // 약수가 없으면 2 반환 (기본값)
  };

  // 선택지 생성 (정답 포함 4개)
  const generateChoices = (answer: number, diff: Difficulty): number[] => {
    const choices = new Set<number>([answer]);
    const range = diff === "easy" ? 10 : 5;

    while (choices.size < 4) {
      const offset = randomInt(-range, range);
      const wrongAnswer = answer + offset;
      if (wrongAnswer !== answer && wrongAnswer > 0) {
        choices.add(wrongAnswer);
      }
    }

    return Array.from(choices).sort(() => Math.random() - 0.5);
  };

  // 문제 생성
  const generateQuestion = (
    diff: Difficulty,
    prevAns: number | null
  ): Question => {
    let text = "";
    let answer = 0;

    if (diff === "easy") {
      // 쉬움: 덧셈, 뺄셈 (1-50)
      const a = randomInt(1, 10);
      const b = randomInt(1, 10);
      const operation = Math.random() < 0.5 ? "+" : "-";

      if (operation === "+") {
        text = `${a} + ${b}`;
        answer = a + b;
      } else {
        // 음수 방지
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        text = `${larger} - ${smaller}`;
        answer = larger - smaller;
      }
    } else if (diff === "normal") {
      // 보통: 사칙연산 모두 (1-9)
      const operations = ["+", "-", "*", "/"];
      const operation = operations[randomInt(0, 3)];

      if (operation === "+") {
        const a = randomInt(1, 50);
        const b = randomInt(1, 50);
        text = `${a} + ${b}`;
        answer = a + b;
      } else if (operation === "-") {
        const a = randomInt(1, 50);
        const b = randomInt(1, 50);
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        text = `${larger} - ${smaller}`;
        answer = larger - smaller;
      } else if (operation === "*") {
        const a = randomInt(1, 9);
        const b = randomInt(1, 9);
        text = `${a} × ${b}`;
        answer = a * b;
      } else {
        // 나눗셈: 정수로 떨어지도록
        const b = randomInt(1, 9);
        const quotient = randomInt(1, 9);
        const a = b * quotient;
        text = `${a} ÷ ${b}`;
        answer = quotient;
      }
    } else {
      // 어려움: 이전 답을 활용
      if (prevAns === null) {
        // 첫 문제 또는 틀렸을 때는 간단한 곱셈/덧셈 (나눗셈 제외)
        const operations = ["+", "*"];
        const operation = operations[randomInt(0, 1)];

        if (operation === "+") {
          const a = randomInt(1, 20);
          const b = randomInt(1, 20);
          text = `${a} + ${b}`;
          answer = a + b;
        } else {
          const a = randomInt(2, 9);
          const b = randomInt(2, 9);
          text = `${a} × ${b}`;
          answer = a * b;
        }
      } else {
        // 이전 답 활용 - "[이전 답]" 형식으로 표시
        const operations = ["+", "-", "*", "/"];
        const operation = operations[randomInt(0, 3)];

        if (operation === "+") {
          const num = randomInt(1, 9);
          text = `[이전 답] + ${num}`;
          answer = prevAns + num;
        } else if (operation === "-") {
          const num = randomInt(1, 9);
          if (prevAns > num) {
            text = `[이전 답] - ${num}`;
            answer = prevAns - num;
          } else {
            text = `[이전 답] + ${num}`;
            answer = prevAns + num;
          }
        } else if (operation === "*") {
          const num = randomInt(2, 5);
          text = `[이전 답] × ${num}`;
          answer = prevAns * num;
        } else {
          // 나눗셈: 이전 답의 약수로 나누기 (항상 정수)
          const divisors = getDivisors(prevAns);
          if (divisors.length > 0) {
            const divisor = divisors[randomInt(0, divisors.length - 1)];
            text = `[이전 답] ÷ ${divisor}`;
            answer = Math.floor(prevAns / divisor); // 소수점 방지
          } else {
            // 약수가 없으면 덧셈으로 대체
            const num = randomInt(1, 9);
            text = `[이전 답] + ${num}`;
            answer = prevAns + num;
          }
        }
      }
    }

    // 모든 답이 정수임을 보장
    answer = Math.round(answer);

    const choices = generateChoices(answer, diff);
    return { text, answer, choices };
  };

  // 게임 시작
  const startGameWithDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setGameCompleted(false);
    setPreviousAnswer(null);
    setShowDifficultySelect(false);
    setInCorrectCount(0);

    // 첫 문제 생성
    const question = generateQuestion(diff, null);
    setCurrentQuestion(question);
    setCurrentQuestionNumber(1);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  // 다음 문제
  const nextQuestion = (
    diff: Difficulty,
    prevAns: number | null,
    currentNum: number
  ) => {
    if (currentNum >= MAX_QUESTIONS) {
      setGameCompleted(true);
      return;
    }

    const question = generateQuestion(diff, prevAns);
    setCurrentQuestion(question);
    setCurrentQuestionNumber(currentNum + 1);
    setShowResult(false);
    setSelectedAnswer(null);
    setPreviousAnswer(prevAns);
  };

  // 답 선택
  const handleAnswerSelect = (answer: number) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuestion?.answer;
    if (isCorrect) {
      if (successSoundRef.current) {
        successSoundRef.current.play();
      }
      setScore((prev) => prev + 1);

      // 다음 문제에 전달할 이전 답 (어려움 난이도일 때만)
      const nextPrevAnswer =
        difficulty === "hard" && currentQuestion
          ? currentQuestion.answer
          : previousAnswer;

      // 현재 문제 번호 저장 (setTimeout 안에서 state가 변경될 수 있으므로)
      const currentNum = currentQuestionNumber;
      const newScore = score + 1;

      // 1.5초 후 다음 문제 (정답일 때만)
      setTimeout(() => {
        if (newScore >= MAX_QUESTIONS) {
          setGameCompleted(true);
        } else {
          nextQuestion(difficulty, nextPrevAnswer, currentNum);
        }
      }, 1500);
    } else {
      if (failSoundRef.current) {
        failSoundRef.current.play();
      }
      // 틀렸을 때는 3초 후 새로운 문제 생성 (이전 답 초기화)
      setTimeout(() => {
        const newQuestion = generateQuestion(difficulty, null);
        setCurrentQuestion(newQuestion);
        setShowResult(false);
        setSelectedAnswer(null);
        setPreviousAnswer(null);
        setInCorrectCount((prev) => prev + 1);
      }, 1500);
    }
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
              <div className="w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] bg-blue-500 rounded-full mx-auto mb-[2vh] flex items-center justify-center">
                <div className="text-white text-[7vw]">🧮</div>
              </div>
              <h1 className="text-[6vw] font-bold text-gray-800 mb-[1vh]">
                산수 게임
              </h1>
              <p className="text-gray-600 text-[3.5vw] mb-[0.5vh]">
                빠르게 계산하고
              </p>
              <p className="text-gray-600 text-[3.5vw]">정답을 맞춰보세요!</p>
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
                    onClick={() => setSelectedDifficulty(key as Difficulty)}
                    className={`w-full p-[2vh] rounded-2xl transition-all ${
                      selectedDifficulty === key
                        ? "bg-blue-400 border-2 border-blue-400"
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
                          config.description
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-orange-600 font-semibold mt-[1vh]">
                        <span className="text-[3.5vw]">🪙</span>
                        <span
                          className={`text-[3.5vw] ${
                            selectedDifficulty === key
                              ? "text-white"
                              : "text-blue-400"
                          }`}
                        >
                          {config.coin}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 게임 시작 버튼 */}
              <div className="mt-[3vh]">
                <button
                  onClick={() =>
                    startGameWithDifficulty(selectedDifficulty as Difficulty)
                  }
                  disabled={!selectedDifficulty}
                  className={`w-[90%] mx-auto block py-[2vh] rounded-full font-bold text-[3.5vw] transition-colors shadow-lg ${
                    selectedDifficulty
                      ? "bg-blue-500 text-white hover:bg-blue-600"
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
    completedGame(
      loginId,
      DIFFICULTY_CONFIGS[selectedDifficulty as keyof typeof DIFFICULTY_CONFIGS]
        .backendIndex,
      true
    );
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[2vh]"
        style={{ backgroundColor: "#F5F1E8" }}
      >
        <div className="bg-white p-[4vh] rounded-2xl shadow-2xl text-center w-[90%] max-w-2xl">
          <div className="text-[10vw] mb-[2vh]">🎉</div>
          <h2 className="text-[5vw] font-bold text-gray-800 mb-[2vh]">완료!</h2>
          <p className="text-[3vw] mb-[3vh] text-black-600">
            틀린 문제 : {inCorrectCount}개
          </p>
          <p className="text-[3vw] mb-[3vh] text-black-600">
            정답률 :{" "}
            <span className="text-green-600 font-bold">
              {Math.round((score / (MAX_QUESTIONS + inCorrectCount)) * 100)}%
            </span>
          </p>
          <div className="space-y-[1.5vh]">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
            >
              다른 난이도 선택
            </button>
            <button
              onClick={() => startGameWithDifficulty(difficulty)}
              className="w-full px-[3vw] py-[2vh] text-[3vw] bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              같은 난이도 다시하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div
      className="min-h-screen p-[2vh]"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <div className="w-[90%] max-w-2xl mx-auto">
        {/* 진행 상황 */}
        <div className="mb-[3vh] bg-white rounded-2xl p-[2vh] shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold text-[3vw]">정답</span>
            <span className="text-blue-600 font-bold text-[3.5vw]">
              {score} / {MAX_QUESTIONS}
            </span>
          </div>
          <div className="mt-[1vh] bg-gray-200 rounded-full h-[1vh]">
            <div
              className="bg-blue-500 h-[1vh] rounded-full transition-all duration-300"
              style={{
                width: `${(score / MAX_QUESTIONS) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 문제 */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl p-[4vh] shadow-lg mb-[3vh]">
            <div className="text-center mb-[4vh]">
              <div className="text-[6vw] font-bold text-gray-800 mb-[2vh]">
                {currentQuestion.text} = ?
              </div>
            </div>

            {/* 선택지 */}
            <div className="grid grid-cols-2 gap-[1.5vh]">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedAnswer === choice;
                const isCorrect = choice === currentQuestion.answer;
                const showCorrectAnswer = showResult && isCorrect;
                const showWrongAnswer = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(choice)}
                    disabled={showResult}
                    className={`p-[3vh] rounded-xl text-[5vw] font-bold transition-all ${
                      showCorrectAnswer
                        ? "bg-green-500 text-white"
                        : showWrongAnswer
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95"
                    } ${showResult ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {choice}
                    {showCorrectAnswer && " ✓"}
                    {showWrongAnswer && " ✗"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-[5vh]"></div>
      </div>
    </div>
  );
}
