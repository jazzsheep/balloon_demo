import { PHYSICS, WIND } from "./config.js";
import { BalloonSimulation } from "./physics/BalloonSimulation.js";
import { CameraController } from "./scene/CameraController.js";
import { SceneManager } from "./scene/SceneManager.js";
import { BalloonMesh } from "./scene/BalloonMesh.js";
import { WindController } from "./input/WindController.js";

/**
 * アプリケーションの組み立てと固定ステップのメインループ。
 * 各モジュールを束ねるだけの薄いオーケストレーション層。
 */
class BalloonApp {
  constructor(canvas) {
    this.simulation = new BalloonSimulation();

    this.cameraController = new CameraController(window.innerWidth / window.innerHeight);
    this.sceneManager = new SceneManager(canvas, this.cameraController);

    this.balloonMesh = new BalloonMesh(this.simulation.positions, this.simulation.index);
    this.sceneManager.add(this.balloonMesh.mesh);

    const hint = document.getElementById("hint");
    this.windController = new WindController(
      canvas,
      this.cameraController,
      this.simulation,
      () => { if (hint) hint.style.opacity = "0"; },
    );
    this.windController.setTarget(this.balloonMesh.mesh);

    window.addEventListener("resize", () => this.sceneManager.resize());

    this._acc = 0;
    this._last = performance.now();
    this._loop = this._loop.bind(this);
  }

  start() {
    this.sceneManager.resize();
    requestAnimationFrame(this._loop);
  }

  /**
   * requestAnimationFrame の可変Δtを固定Δtで小刻みに消化する
   * （アキュムレータ方式）。
   */
  _loop(now) {
    let frame = (now - this._last) / 1000;
    this._last = now;
    if (frame > 0.1) frame = 0.1; // タブ復帰などの暴走を防ぐ
    this._acc += frame;

    this.windController.update();

    let steps = 0;
    while (this._acc >= PHYSICS.dt && steps < PHYSICS.maxStepsPerFrame) {
      this.simulation.step();
      this._acc -= PHYSICS.dt;
      steps++;
    }
    this.simulation.cursorSpeed *= WIND.cursorSpeedDecay; // カーソル速度の減衰

    this.balloonMesh.sync();
    this.cameraController.update();
    this.sceneManager.render();

    requestAnimationFrame(this._loop);
  }
}

const canvas = document.getElementById("scene");
new BalloonApp(canvas).start();
