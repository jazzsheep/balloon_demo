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

    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xff6a4d,
      roughness: 0.32,
      metalness: 0.0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.35,
      transparent: true,
      opacity: 0.84,
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
