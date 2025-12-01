// box-stacking/utils.ts
export const SCALE = 40; // 1 meter = 40 px
export const TIME_STEP = 1 / 60;

// 반응형 기준값
export const BASE_SCREEN_HEIGHT = 800;
export const BASE_GRAVITY = 10;

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
