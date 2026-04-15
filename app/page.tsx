import Link from "next/link";
import React from "react";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col justify-center items-center p-5 sm:p-8">
      <h1 className="text-white text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 text-center drop-shadow-lg">
        🎮 도토리 게임
      </h1>
      
      <div className="flex flex-col gap-5 w-full max-w-sm">
        <Link 
          href="/crossword_puzzles" 
          className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20"
        >
          <span className="block text-2xl sm:text-3xl mb-2">🧩</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            가로세로 게임
          </span>
        </Link>
        
        <Link 
          href="/color_line_game" 
          className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20"
        >
          <span className="block text-2xl sm:text-3xl mb-2">🎨</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            선 연결 게임
          </span>
        </Link>

        <Link 
          href="/arithmetic_game" 
          className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20"
        >
          <span className="block text-2xl sm:text-3xl mb-2">🧮</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            사칙연산 게임
          </span>
        </Link>

        <Link 
          href="/flip_card_game" 
          className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20"
        >
          <span className="block text-2xl sm:text-3xl mb-2">🃏</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            카드 뒤집기 게임
          </span>
        </Link>

        <Link href="/box_stacking_game" className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20">
          <span className="block text-2xl sm:text-3xl mb-2">🎲</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            박스 쌓기 게임
          </span>
        </Link>

        <Link href="/hidden_picture_puzzle" className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20">
          <span className="block text-2xl sm:text-3xl mb-2">🔍</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            숨은 그림 찾기
          </span>
        </Link>

        <Link href="/ox_quiz" className="group block p-5 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white active:translate-y-0 border border-white/20">
          <span className="block text-2xl sm:text-3xl mb-2">❓</span>
          <span className="block text-gray-800 font-semibold text-base sm:text-lg">
            OX 퀴즈
          </span>
        </Link>

      </div>
    </div>
  );
}

export default Home;
