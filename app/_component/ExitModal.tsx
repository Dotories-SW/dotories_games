"use client";

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExit: () => void | Promise<void>; // 종료 처리 함수 (useExitModal의 handleExit)
}

export default function ExitModal({ isOpen, onClose, onExit }: ExitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-[4vh] w-[90%] max-w-md shadow-2xl text-center">
        <div className="text-[8vw] mb-[2vh]">🚪</div>
        <h2 className="text-[5vw] font-bold text-gray-800 mb-[1vh]">
          게임을 종료하시겠어요?
        </h2>
        <p className="text-[3.5vw] text-gray-600 mb-[3vh]">
          진행 중인 게임은 저장되지 않습니다.
        </p>
        <div className="flex gap-[2vw]">
          <button
            onClick={onClose}
            className="flex-1 py-[2.5vh] border border-gray-300 text-gray-700 rounded-xl font-bold text-[4vw] hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-[2.5vh] bg-red-500 text-white rounded-xl font-bold text-[4vw] hover:bg-red-600 transition-colors"
          >
            종료
          </button>
        </div>
      </div>
    </div>
  );
}
