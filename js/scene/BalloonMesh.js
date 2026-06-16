import * as THREE from "three";

/**
 * シミュレーションの頂点バッファを Three.js のメッシュへ橋渡しする。
 * 薄いビニールらしい半透明＆光沢のマテリアルを持ち、毎フレーム
 * 頂点位置と法線を更新する。
 */
export class BalloonMesh {
  /**
   * @param {Float32Array} positions シミュレーションと共有する頂点座標バッファ
   * @param {Uint16Array} index      三角形インデックス
   */
  constructor(positions, index) {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setIndex(new THREE.BufferAttribute(index, 1));
    this.geometry.computeVertexNormals();

    // 農業用ビニールシート：薄膜干渉による虹色＋高い透過性
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0x050810,          // ほぼ黒：暗いほど表面の虹彩が鮮明になる
      roughness: 0.03,
      metalness: 0.0,
      transmission: 0.55,       // 光を通す透過感（高すぎると虹彩が薄れる）
      thickness: 0.3,
      ior: 1.46,                // ポリエチレンの屈折率
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 1.0,
      iridescenceIOR: 1.55,     // 高めにすると色相の帯域が広がる
      iridescenceThicknessRange: [100, 600], // 薄め寄りにすると青〜緑〜金が出やすい
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  /** 頂点が動いた後に呼び、ジオメトリ情報を再計算する。 */
  sync() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
  }
}
