/**
 * アイコスフィア生成（頂点を溶接した連結メッシュ）。
 *
 * Three.js の IcosahedronGeometry は頂点が重複していて膜がバラける為、
 * 中点をキャッシュして共有頂点の球を自前で構築する。
 *
 * @param {number} radius  球の半径
 * @param {number} subdiv  細分化レベル
 * @returns {{
 *   pos: Float32Array,    // 頂点座標（xyz × 頂点数）
 *   index: Uint16Array,   // 三角形インデックス
 *   faces: number[][],    // 面（頂点インデックスの三つ組）
 *   edges: {a:number,b:number,rest:number}[], // 一意な辺（距離拘束用）
 *   count: number         // 頂点数
 * }}
 */
export function buildIcosphere(radius, subdiv) {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  for (let s = 0; s < subdiv; s++) {
    const mid = {};
    const nf = [];
    const midpoint = (a, b) => {
      const key = a < b ? a + "_" + b : b + "_" + a;
      if (mid[key] !== undefined) return mid[key];
      const va = verts[a], vb = verts[b];
      verts.push([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]);
      return (mid[key] = verts.length - 1);
    };
    for (const f of faces) {
      const a = midpoint(f[0], f[1]);
      const b = midpoint(f[1], f[2]);
      const c = midpoint(f[2], f[0]);
      nf.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]);
    }
    faces = nf;
  }

  // 球面に正規化して半径を掛ける
  const pos = new Float32Array(verts.length * 3);
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i];
    const len = Math.hypot(v[0], v[1], v[2]);
    pos[i * 3] = (v[0] / len) * radius;
    pos[i * 3 + 1] = (v[1] / len) * radius;
    pos[i * 3 + 2] = (v[2] / len) * radius;
  }

  // 一意な辺（距離拘束用）
  const edgeSet = new Set();
  const edges = [];
  const addEdge = (a, b) => {
    const key = a < b ? a + "_" + b : b + "_" + a;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    const dx = pos[b * 3] - pos[a * 3];
    const dy = pos[b * 3 + 1] - pos[a * 3 + 1];
    const dz = pos[b * 3 + 2] - pos[a * 3 + 2];
    edges.push({ a, b, rest: Math.hypot(dx, dy, dz) });
  };
  for (const f of faces) {
    addEdge(f[0], f[1]);
    addEdge(f[1], f[2]);
    addEdge(f[2], f[0]);
  }

  const index = new Uint16Array(faces.length * 3);
  for (let i = 0; i < faces.length; i++) {
    index[i * 3] = faces[i][0];
    index[i * 3 + 1] = faces[i][1];
    index[i * 3 + 2] = faces[i][2];
  }

  return { pos, index, faces, edges, count: verts.length };
}
