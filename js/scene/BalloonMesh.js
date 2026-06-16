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
      color: 0xddeeff,          // ほぼ無色透明のベース
      roughness: 0.04,          // 表面は滑らか
      metalness: 0.0,
      transmission: 0.72,       // 光を通す（農業用ビニールらしい透け感）
      thickness: 0.4,           // 膜の厚み（透過色の屈折に影響）
      ior: 1.46,                // ポリエチレンの屈折率
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 1.0,         // 複屈折（薄膜干渉）を最大に
      iridescenceIOR: 1.38,     // 薄膜層の屈折率
      iridescenceThicknessRange: [200, 800], // 膜厚(nm)の範囲で色域が決まる
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
