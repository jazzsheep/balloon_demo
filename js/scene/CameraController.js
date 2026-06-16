import * as THREE from "three";
import { CAMERA } from "../config.js";

/**
 * 注視点（原点）を中心に球面座標で回るオービットカメラ。
 * ドラッグでの視点回転を担い、風の入力とは分離されている。
 */
export class CameraController {
  constructor(aspect = 1) {
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, aspect, CAMERA.near, CAMERA.far);
    this.azimuth = CAMERA.azimuth;
    this.polar = CAMERA.polar;
    this.distance = CAMERA.distance;
    this._place();
  }

  _place() {
    const { camera, distance: d, polar, azimuth: az } = this;
    camera.position.set(
      d * Math.sin(polar) * Math.sin(az),
      d * Math.cos(polar),
      d * Math.sin(polar) * Math.cos(az),
    );
    camera.lookAt(0, 0, 0);
  }

  /** ピクセル単位のドラッグ量に応じて視点を回す。 */
  rotate(deltaX, deltaY) {
    this.azimuth -= deltaX * CAMERA.rotateSpeed;
    this.polar -= deltaY * CAMERA.rotateSpeed;
    this.polar = Math.max(CAMERA.polarMin, Math.min(CAMERA.polarMax, this.polar));
  }

  /** 毎フレームの位置更新。 */
  update() {
    this._place();
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
