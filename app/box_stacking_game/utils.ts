// box-stacking/utils.ts
export const SCALE = 40; // 1 meter = 40 px
export const TIME_STEP = 1 / 60;

// 반응형 기준값
export const BASE_SCREEN_HEIGHT = 800;
export const BASE_GRAVITY = 5; // 떨어지는 속도 조정 (10 → 8)

// settled 박스들 tilt 체크 기준 (10도)
export const TILT_LIMIT = (10 * Math.PI) / 180;

export const CAMERA_LERP = 0.08; // 카메라가 타겟을 따라가는 정도
export const CAMERA_MAX_STEP = 0.25; // 한 프레임당 카메라가 움직일 수 있는 최대 거리(m)

export const BOX_IMAGE_PATHS = [
  "/box/box_1.png",
  "/box/box_2.png",
  "/box/box_3.png",
  "/box/box_4.png",
];

export const DUST_IMAGE_PATHS = [
  "/box/effect/dust_1.png",
  "/box/effect/dust_2.png",
  "/box/effect/dust_3.png",
  "/box/effect/dust_4.png",
];

export const SCORE_IMAGE_PATHS: { [key: number]: string } = {
  5: "/box/score/score_5.png",
  7: "/box/score/score_7.png",
  10: "/box/score/score_10.png",
};

export const FALLING_SOUND_PATH = "/sounds/box_stacking/falling_box.mp3";
export const BOX_STACK_SOUND_PATH = "/sounds/box_stacking/box_stacking_bgm.mp3";

// 화면 크기 기준으로 월드 크기 계산
export const getWorldSize = (width: number, height: number) => {
  return {
    width: width / SCALE,
    height: height / SCALE,
  };
};

// 화면 높이에 따라 중력 계산
export const getGravityValue = (screenHeight: number) => {
  const gravityScaleRaw = screenHeight / BASE_SCREEN_HEIGHT;
  const gravityScale = Math.max(0.7, Math.min(1.4, gravityScaleRaw));
  return BASE_GRAVITY * gravityScale;
};

// 화면 너비에 비례한 박스 속도 계산 (OS 기반)
export const getBoxSpeed = (screenWidth: number, os?: string) => {
  const isTablet = screenWidth >= 768;

  let pixelsPerSecond: number;

  if (isTablet) {
    // 태블릿: 비율을 낮추고 최대값 제한
    pixelsPerSecond = screenWidth * 0.18; // 0.20 → 0.18로 감소
  } else {
    // 모바일: 비율 감소
    const baseRatio = 0.26; // 0.30 → 0.26으로 감소
    pixelsPerSecond = screenWidth * baseRatio;
  }

  const speed = pixelsPerSecond / SCALE; // m/s로 변환

  // 최소/최대 속도 제한
  if (os === "ios") {
    const MAX_SPEED = 2.5;
    const MIN_SPEED = 2.5;
    return Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  } else {
    const MIN_SPEED = 1; // 최소 속도
    const MAX_SPEED = 1; // 최대 속도
    return Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  }
};

// 화면 너비에 비례한 박스 속도 증가량 계산 (OS 기반)
export const getBoxSpeedIncrement = (screenWidth: number, os?: string) => {
  const isTablet = screenWidth >= 768;

  // 기본 속도의 증가량
  const baseIncrement = isTablet ? 0.05 : 0.04; // 0.06 → 0.05, 0.05 → 0.04로 감소
  const pixelsPerSecond = screenWidth * baseIncrement;

  const increment = pixelsPerSecond / SCALE;

  // 증가량도 최대값 제한 (너무 빨라지지 않도록)
  const MAX_INCREMENT = 0.4; // 0.5 → 0.4로 감소
  return Math.min(MAX_INCREMENT, increment);
};
