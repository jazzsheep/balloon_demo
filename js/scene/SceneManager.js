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
    // transmission（物理的な光透過）を有効にするために必要
    this.renderer.capabilities.logarithmicDepthBuffer = false;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(SCENE.fogColor, SCENE.fogDensity);

    this._setupLights();
  }

  _setupLights() {
    // 空（青白）と地面（やや暖色）の環境光で屋外の散乱光を模倣
    this.scene.add(new THREE.HemisphereLight(0xc8deff, 0x8a7050, 0.6));

    // 太陽光：やや黄みがかった強い平行光、南西の高い位置から
    const sun = new THREE.DirectionalLight(0xfff4d6, 3.5);
    sun.position.set(6, 14, 8);
    this.scene.add(sun);

    // 空からの反射（薄い青）
    const sky = new THREE.DirectionalLight(0x99bbff, 0.4);
    sky.position.set(-8, 6, -6);
    this.scene.add(sky);
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
