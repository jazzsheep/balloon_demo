/**
 * シミュレーション全体のチューニング値を一元管理する設定モジュール。
 * 値を変えるだけで挙動を調整できるよう、各所のマジックナンバーをここへ集約している。
 */

export const BALLOON = {
  radius: 5, // 半径5m ≒ 直径10mの風船
  subdivisions: 3, // アイコスフィアの細分化レベル（detail3 → 642頂点 / 1280面）
};

export const PHYSICS = {
  dt: 1 / 120, // 固定タイムステップ
  gravity: -1.2, // ほぼ浮力と釣り合う軽い重力
  centerK: 0.7, // 画面内に保つ為の重心の戻し
  damping: 0.992, // 速度減衰
  constraintIterations: 4, // 距離拘束を満たす反復回数
  maxStepsPerFrame: 8, // 1フレームで消化する最大ステップ数（暴走防止）
};

/** スライダーで動的に変更できる初期パラメータ。 */
export const DEFAULTS = {
  windStrength: 8, // 風の強さ
  pressureK: 80, // 内圧（張り）
  stiffness: 0.92, // 距離拘束の硬さ（膜のやわらかさ）
};

export const WIND = {
  // カーソル当たり点からのガウシアン減衰の広がり（半径に対する比）。
  radiusRatio: 0.55,
  falloffCutoff: 0.02, // この重み未満の頂点はスキップ
  speedBoost: 0.05, // カーソル速度による風の増幅係数
  turbulence: 0.3, // 生きた風に見せるランダム揺らぎの割合
  cursorSpeedCap: 60, // 蓄積するカーソル速度の上限
  cursorSpeedDecay: 0.85, // 毎フレームのカーソル速度減衰
};

export const CAMERA = {
  fov: 45,
  near: 0.1,
  far: 200,
  azimuth: 0.6, // 初期方位角
  polar: 1.35, // 初期仰角
  distance: 17, // 注視点からの距離
  rotateSpeed: 0.005, // ドラッグ回転の感度
  polarMin: 0.25, // 仰角の下限（真上・真下を避ける）
  polarMax: Math.PI - 0.25, // 仰角の上限
};

export const SCENE = {
  fogColor: 0x0c0e15,
  fogDensity: 0.012,
  maxPixelRatio: 2,
};
