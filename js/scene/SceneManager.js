import * as THREE from "three";
import { SCENE } from "../config.js";

/**
 * レンダラ・シーン・ライティングをまとめて構築・管理する。
 * リサイズへの追従もここで担う。
 */
export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvas      描画先キャンバス
   * @param {CameraController} cameraController カメラ制御
   */
  constructor(canvas, cameraController) {
    this.canvas = canvas;
    this.cameraController = cameraController;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE.maxPixelRatio));

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(SCENE.fogColor, SCENE.fogDensity);

    this._setupLights();
  }

  _setupLights() {
    // ライティング：柔らかい環境光＋斜め前からのキーライトで膜の張りを出す
    this.scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x202020, 0.85));

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(8, 12, 10);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x88aaff, 0.6);
    rim.position.set(-10, -4, -8);
    this.scene.add(rim);
  }

  add(object3D) {
    this.scene.add(object3D);
  }

  /** ウィンドウサイズへ追従する。 */
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.cameraController.setAspect(w / h);
  }

  render() {
    this.renderer.render(this.scene, this.cameraController.camera);
  }
}
