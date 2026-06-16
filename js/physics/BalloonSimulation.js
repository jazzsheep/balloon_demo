import { PHYSICS, DEFAULTS, WIND, BALLOON } from "../config.js";
import { buildIcosphere } from "../geometry/icosphere.js";
import { computeVolume } from "./volume.js";

/**
 * 位置ベースVerlet積分による風船の膜シミュレーション。
 *
 * 状態（頂点位置・速度・力）と、内圧・距離拘束・風・重力といった
 * 物理ルールを保持する。描画には依存せず、`positions` を通じて
 * 現在の頂点座標を外部へ公開する。
 */
export class BalloonSimulation {
  constructor() {
    // 動的に調整できるパラメータ（UI から書き換えられる）
    this.windStrength = DEFAULTS.windStrength;
    this.pressureK = DEFAULTS.pressureK;
    this.stiffness = DEFAULTS.stiffness;

    // 風の入力状態（WindController から更新される）
    this.wind = { active: false, px: 0, py: 0, pz: 0, dx: 0, dy: 0, dz: 0 };
    this.cursorSpeed = 0;

    this._build();
  }

  _build() {
    const sphere = buildIcosphere(BALLOON.radius, BALLOON.subdivisions);
    this.sphere = sphere;
    this.N = sphere.count;
    this.faces = sphere.faces;
    this.edges = sphere.edges;
    this.index = sphere.index;

    this.pos = new Float32Array(sphere.pos); // 現在位置
    this.prev = new Float32Array(sphere.pos); // 1ステップ前の位置（=速度0で開始）
    this.frc = new Float32Array(this.N * 3); // 力の蓄積
    this.restVolume = computeVolume(this.pos, this.faces);
  }

  /** 描画側へ渡す現在の頂点座標バッファ。 */
  get positions() {
    return this.pos;
  }

  /** 形状を初期状態へ戻す。 */
  reset() {
    this.pos.set(this.sphere.pos);
    this.prev.set(this.sphere.pos);
    this.restVolume = computeVolume(this.pos, this.faces);
  }

  /** 内圧：初期体積を保つ向きに各面を押す。 */
  _accumulatePressure(P) {
    const { pos, frc, faces } = this;
    for (let i = 0; i < faces.length; i++) {
      const ai = faces[i][0] * 3, bi = faces[i][1] * 3, ci = faces[i][2] * 3;
      const e1x = pos[bi] - pos[ai], e1y = pos[bi + 1] - pos[ai + 1], e1z = pos[bi + 2] - pos[ai + 2];
      const e2x = pos[ci] - pos[ai], e2y = pos[ci + 1] - pos[ai + 1], e2z = pos[ci + 2] - pos[ai + 2];
      // cross(e1,e2) = 外向き法線 × 2*面積
      const nx = (e1y * e2z - e1z * e2y) * 0.5;
      const ny = (e1z * e2x - e1x * e2z) * 0.5;
      const nz = (e1x * e2y - e1y * e2x) * 0.5;
      const fx = nx * P, fy = ny * P, fz = nz * P;
      frc[ai] += fx; frc[ai + 1] += fy; frc[ai + 2] += fz;
      frc[bi] += fx; frc[bi + 1] += fy; frc[bi + 2] += fz;
      frc[ci] += fx; frc[ci + 1] += fy; frc[ci + 2] += fz;
    }
  }

  /** 風（カーソル当たり点の近傍に力を加える）。 */
  _applyWind() {
    if (!this.wind.active) return;
    const { pos, frc, wind, N } = this;
    const str = this.windStrength * (1 + this.cursorSpeed * WIND.speedBoost);
    const r = BALLOON.radius * WIND.radiusRatio;
    const r2 = r * r;
    for (let i = 0; i < N; i++) {
      const ddx = pos[i * 3] - wind.px;
      const ddy = pos[i * 3 + 1] - wind.py;
      const ddz = pos[i * 3 + 2] - wind.pz;
      const dist2 = ddx * ddx + ddy * ddy + ddz * ddz;
      const w = Math.exp(-dist2 / r2); // 当たり点からのガウシアン減衰
      if (w < WIND.falloffCutoff) continue;
      const f = str * w;
      const turb = WIND.turbulence;
      frc[i * 3] += wind.dx * f + (Math.random() - 0.5) * f * turb;
      frc[i * 3 + 1] += wind.dy * f + (Math.random() - 0.5) * f * turb;
      frc[i * 3 + 2] += wind.dz * f + (Math.random() - 0.5) * f * turb;
    }
  }

  /** 距離拘束を反復で満たす（膜の伸びを抑える）。 */
  _satisfyConstraints() {
    const { pos, edges, stiffness } = this;
    for (let it = 0; it < PHYSICS.constraintIterations; it++) {
      for (let k = 0; k < edges.length; k++) {
        const e = edges[k], a = e.a * 3, b = e.b * 3;
        const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = ((d - e.rest) / d) * 0.5 * stiffness;
        const ox = dx * diff, oy = dy * diff, oz = dz * diff;
        pos[a] += ox; pos[a + 1] += oy; pos[a + 2] += oz;
        pos[b] -= ox; pos[b + 1] -= oy; pos[b + 2] -= oz;
      }
    }
  }

  /** 1物理ステップ（固定タイムステップ）を進める。 */
  step() {
    const { pos, prev, frc, N } = this;
    frc.fill(0);

    // --- 重心を原点へ戻す（変形させず平行移動だけ抑える） ---
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < N; i++) {
      cx += pos[i * 3];
      cy += pos[i * 3 + 1];
      cz += pos[i * 3 + 2];
    }
    cx /= N; cy /= N; cz /= N;
    const rcx = -PHYSICS.centerK * cx;
    const rcy = -PHYSICS.centerK * cy;
    const rcz = -PHYSICS.centerK * cz;

    // --- 内圧：初期体積を保つ向きに各面を押す ---
    const V = computeVolume(pos, this.faces);
    const P = this.pressureK * (this.restVolume / Math.max(V, 1e-3) - 1);
    this._accumulatePressure(P);

    // --- 重力・重心戻し ---
    for (let i = 0; i < N; i++) {
      frc[i * 3] += rcx;
      frc[i * 3 + 1] += PHYSICS.gravity + rcy;
      frc[i * 3 + 2] += rcz;
    }

    // --- 風 ---
    this._applyWind();

    // --- Verlet積分： x' = x + (x - x_prev)*damp + (F/m)*dt^2 ---
    const dt2 = PHYSICS.dt * PHYSICS.dt;
    for (let i = 0; i < N * 3; i++) {
      const cur = pos[i];
      const vel = (cur - prev[i]) * PHYSICS.damping;
      pos[i] = cur + vel + frc[i] * dt2;
      prev[i] = cur;
    }

    // --- 距離拘束 ---
    this._satisfyConstraints();
  }
}
