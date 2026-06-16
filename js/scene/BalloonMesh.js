import * as THREE from "three";
import { thinFilmUniforms, thinFilmFn, thinFilmInject } from "../shaders/thinFilmChunk.js";

/**
 * シミュレーションの頂点バッファを Three.js のメッシュへ橋渡しする。
 *
 * マテリアルは MeshPhysicalMaterial（高透過性 PE）をベースに、
 * onBeforeCompile で薄膜干渉シェーダーを注入する。
 * これにより transmission（透過）とは独立した加算合成の虹彩が得られ、
 * ベースカラーの明暗に関係なく鮮明な干渉色が表れる。
 */
export class BalloonMesh {
  /**
   * @param {Float32Array} positions シミュレーションと共有する頂点座標バッファ
   * @param {Uint16Array}  index     三角形インデックス
   */
  constructor(positions, index) {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setIndex(new THREE.BufferAttribute(index, 1));
    this.geometry.computeVertexNormals();

    // 農業用 PE ビニールの素体。ほぼ透明でベース色は最小限に。
    // 虹彩はカスタムシェーダーが加算するので、ここでは color を暗く抑える。
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0x001428,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.88,   // 高透過率（光を通す薄いビニール感）
      thickness: 0.3,
      ior: 1.46,            // ポリエチレンの屈折率
      clearcoat: 0.5,
      clearcoatRoughness: 0.02,
      side: THREE.DoubleSide,
    });

    // 薄膜パラメータ（uniform 経由でランタイムに変更可能）
    this.filmUniforms = {
      uFilmThickness: { value: 320.0 }, // 膜厚(nm)：小さい→青緑、大きい→赤紫
      uFilmIOR:       { value: 1.55  }, // 薄膜コーティングの屈折率
      uIridStrength:  { value: 1.3   }, // 虹彩の加算強度
    };

    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.filmUniforms);

      // uniform 宣言と干渉関数をシェーダー先頭に注入
      shader.fragmentShader =
        thinFilmUniforms + "\n" +
        thinFilmFn       + "\n" +
        shader.fragmentShader;

      // dithering の後（= フレームバッファへの最終書き込み直前）に加算
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        "#include <dithering_fragment>\n" + thinFilmInject,
      );
    };

    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  /** 頂点が動いた後に呼び、ジオメトリ情報を再計算する。 */
  sync() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
  }
}
