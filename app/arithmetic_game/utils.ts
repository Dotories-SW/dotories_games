// arithmetic/utils.ts
import type { Difficulty, DifficultyConfig, Question } from "./types";

export const MAX_QUESTIONS = 10;

// 난이도별 설정
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
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

// 랜덤 숫자
export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 약수 (나눗셈용)
export const getDivisors = (num: number): number[] => {
  const divisors: number[] = [];
  for (let i = 2; i <= Math.min(num, 9); i++) {
    if (num % i === 0) {
      divisors.push(i);
    }
  }
  return divisors;
};

// 선택지 생성
export const generateChoices = (
  answer: number,
  diff: Difficulty
): number[] => {
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

// 문제 생성 전체 로직
export const generateQuestion = (
  diff: Difficulty,
  prevAns: number | null
): Question => {
  let text = "";
  let answer = 0;

  if (diff === "easy") {
    // 쉬움: 덧셈, 뺄셈 (1~10)
    const a = randomInt(1, 10);
    const b = randomInt(1, 10);
    const operation = Math.random() < 0.5 ? "+" : "-";

    if (operation === "+") {
      text = `${a} + ${b}`;
      answer = a + b;
    } else {
      const larger = Math.max(a, b);
      const smaller = Math.min(a, b);
      text = `${larger} - ${smaller}`;
      answer = larger - smaller;
    }
  } else if (diff === "normal") {
    // 보통: 사칙연산 (+, -, ×, ÷)
    const operations = ["+", "-", "*", "/"] as const;
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
      const b = randomInt(1, 9);
      const quotient = randomInt(1, 9);
      const a = b * quotient;
      text = `${a} ÷ ${b}`;
      answer = quotient;
    }
  } else {
    // hard: 이전 답 활용
    if (prevAns === null) {
      // 첫 문제 or 틀린 직후
      const operations = ["+", "*"] as const;
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
      const operations = ["+", "-", "*", "/"] as const;
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
        const divisors = getDivisors(prevAns);
        if (divisors.length > 0) {
          const divisor = divisors[randomInt(0, divisors.length - 1)];
          text = `[이전 답] ÷ ${divisor}`;
          answer = Math.floor(prevAns / divisor);
        } else {
          const num = randomInt(1, 9);
          text = `[이전 답] + ${num}`;
          answer = prevAns + num;
        }
      }
    }
  }

  answer = Math.round(answer);
  const choices = generateChoices(answer, diff);
  return { text, answer, choices };
};
