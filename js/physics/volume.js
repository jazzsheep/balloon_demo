/**
 * 閉曲面の符号付き体積を求める。
 * 各三角形を原点とで構成する四面体の符号付き体積を総和する。
 *
 * @param {Float32Array} p     頂点座標（xyz × 頂点数）
 * @param {number[][]} faces   面（頂点インデックスの三つ組）
 * @returns {number} 体積
 */
export function computeVolume(p, faces) {
  let v = 0;
  for (let i = 0; i < faces.length; i++) {
    const a = faces[i][0] * 3, b = faces[i][1] * 3, c = faces[i][2] * 3;
    const ax = p[a], ay = p[a + 1], az = p[a + 2];
    const bx = p[b], by = p[b + 1], bz = p[b + 2];
    const cx = p[c], cy = p[c + 1], cz = p[c + 2];
    v += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  }
  return v / 6;
}
