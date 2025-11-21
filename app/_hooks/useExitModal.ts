"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseExitModalOptions {
  onExit?: () => void | Promise<void>;
  enabled?: boolean; // 모달 활성화 여부
}

export function useExitModal({ onExit, enabled = true }: UseExitModalOptions = {}) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const hasPushedStateRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // 비활성화 시 히스토리 정리
      if (hasPushedStateRef.current) {
        window.history.back();
        hasPushedStateRef.current = false;
      }
      return;
    }

    // 히스토리에 상태 추가 (뒤로가기 감지를 위해)
    // 이미 추가했다면 다시 추가하지 않음
    if (!hasPushedStateRef.current) {
      window.history.pushState(null, "", window.location.href);
      hasPushedStateRef.current = true;
    }

    // 뒤로가기 버튼 감지
    const handlePopState = () => {
      // 이미 모달이 열려있거나 네비게이션 중이면 무시
      if (showModal || isNavigatingRef.current) {
        return;
      }

      // 기본 뒤로가기 동작 막기
      // 히스토리를 다시 추가해서 현재 페이지에 머물게 함
      window.history.pushState(null, "", window.location.href);
      
      // 모달 표시
      setShowModal(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, showModal]);

  const handleExit = async () => {
    isNavigatingRef.current = true;
    
    // 게임별 정리 로직 실행
    if (onExit) {
      await onExit();
    }
    
    // 히스토리 정리 - 추가한 엔트리만큼 뒤로가기
    // pushState를 2번 했으므로 (초기 1번 + popstate에서 1번) 2번 뒤로가기
    if (hasPushedStateRef.current) {
      window.history.go(-2); // 추가한 히스토리 엔트리 2개 제거
      hasPushedStateRef.current = false;
    } else {
      // 혹시 모를 경우를 대비
      router.back();
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return {
    showModal,
    handleExit,
    handleClose,
  };
}

