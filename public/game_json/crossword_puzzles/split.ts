// split-by-difficulty.ts
import fs from "fs";
import path from "path";

// 프로젝트 루트 기준으로 경로 설정
const crosswordDir = path.join(process.cwd(), "public", "game_json", "crossword_puzzles");
const inputPath = path.join(crosswordDir, "crossword_puzzles.json");
const outputDir = crosswordDir;

const raw = fs.readFileSync(inputPath, "utf-8");
const puzzles = JSON.parse(raw);

// 난이도별로 필터링
interface Puzzle {
  difficulty: string;
  [key: string]: unknown;
}

const easy   = puzzles.filter((p: Puzzle) => p.difficulty === "easy");
const medium = puzzles.filter((p: Puzzle) => p.difficulty === "medium");
const hard   = puzzles.filter((p: Puzzle) => p.difficulty === "hard");

// 각각 저장
fs.writeFileSync(path.join(outputDir, "crossword_puzzles_easy.json"), JSON.stringify(easy, null, 2), "utf-8");
fs.writeFileSync(path.join(outputDir, "crossword_puzzles_normal.json"), JSON.stringify(medium, null, 2), "utf-8");
fs.writeFileSync(path.join(outputDir, "crossword_puzzles_hard.json"), JSON.stringify(hard, null, 2), "utf-8");

console.log("easy / normal / hard 파일 3개 생성 완료");
