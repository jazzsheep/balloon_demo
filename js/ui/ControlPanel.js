/**
 * 左下のコントロールパネル。スライダーとリセットボタンを
 * シミュレーションのパラメータへ結びつける。DOM 操作をここへ閉じ込め、
 * シミュレーション本体を UI から独立させる。
 */
export class ControlPanel {
  /**
   * @param {BalloonSimulation} simulation
   */
  constructor(simulation) {
    this.simulation = simulation;

    this._bindSlider("wind", "windVal", (v) => {
      simulation.windStrength = v;
      return String(v);
    });
    this._bindSlider("press", "pressVal", (v) => {
      simulation.pressureK = v;
      return String(v);
    });
    this._bindSlider("soft", "softVal", (v) => {
      simulation.stiffness = v;
      return v.toFixed(2);
    });

    document.getElementById("reset").addEventListener("click", () => simulation.reset());
  }

  /**
   * スライダーとラベルを結びつけ、入力のたびにシミュレーションへ反映する。
   * @param {string} inputId  range input の id
   * @param {string} labelId  数値表示ラベルの id
   * @param {(value:number)=>string} apply 値を適用しラベル文字列を返す
   */
  _bindSlider(inputId, labelId, apply) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    input.addEventListener("input", (e) => {
      label.textContent = apply(+e.target.value);
    });
  }
}
