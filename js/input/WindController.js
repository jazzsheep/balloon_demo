import * as THREE from "three";
import { WIND } from "../config.js";

/**
 * ポインタ入力を解釈し、二つの操作へ振り分ける。
 *  - ホバー：レイキャストで風船の当たり点を求め、風の入力としてシミュレーションへ渡す
 *  - ドラッグ：カメラの視点回転（風とは分離）
 */
export class WindController {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CameraController} cameraController
   * @param {BalloonSimulation} simulation
   * @param {() => void} [onDragStart] ドラッグ開始時のコールバック（ヒント非表示など）
   */
  constructor(canvas, cameraController, simulation, onDragStart) {
    this.canvas = canvas;
    this.cameraController = cameraController;
    this.simulation = simulation;
    this.onDragStart = onDragStart;

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.target = null; // レイキャスト対象のメッシュ

    this.hovering = false;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.lastDragX = 0;
    this.lastDragY = 0;

    this._bindEvents();
  }

  /** レイキャスト対象（風船メッシュ）を設定する。 */
  setTarget(mesh) {
    this.target = mesh;
  }

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener("pointermove", (e) => this._onPointerMove(e));
    c.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    c.addEventListener("pointerup", () => this._endDrag());
    c.addEventListener("pointercancel", () => this._endDrag());
    c.addEventListener("pointerleave", () => {
      this.hovering = false;
      this.simulation.wind.active = false;
    });
  }

  _onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // カーソル速度を蓄積（風の増幅に使う）
    const sp = Math.hypot(e.clientX - this.lastX, e.clientY - this.lastY);
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.simulation.cursorSpeed = Math.min(this.simulation.cursorSpeed + sp, WIND.cursorSpeedCap);
    this.hovering = true;

    // ドラッグ中は視点回転
    if (this.dragging) {
      this.cameraController.rotate(e.clientX - this.lastDragX, e.clientY - this.lastDragY);
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;
    }
  }

  _onPointerDown(e) {
    this.dragging = true;
    this.lastDragX = e.clientX;
    this.lastDragY = e.clientY;
    this.canvas.setPointerCapture(e.pointerId);
    if (this.onDragStart) this.onDragStart();
  }

  _endDrag() {
    this.dragging = false;
  }

  /** 毎フレーム、当たり点を求めて風の入力を更新する。 */
  update() {
    const wind = this.simulation.wind;
    if (this.dragging || !this.target) {
      wind.active = false;
      return;
    }
    this.raycaster.setFromCamera(this.ndc, this.cameraController.camera);
    const hits = this.raycaster.intersectObject(this.target);
    if (hits.length) {
      const p = hits[0].point;
      wind.active = true;
      wind.px = p.x; wind.py = p.y; wind.pz = p.z;
      // 風向き＝カメラから当たり点へ（画面の奥へ押し込む）
      const d = this.raycaster.ray.direction;
      wind.dx = d.x; wind.dy = d.y; wind.dz = d.z;
    } else {
      wind.active = false;
    }
  }
}
