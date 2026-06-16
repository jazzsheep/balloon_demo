/**
 * 薄膜干渉（thin-film interference）シェーダーチャンク。
 *
 * MeshPhysicalMaterial.onBeforeCompile から注入して使う。
 * 透過（transmission）パスとは独立した加算項として虹彩を合成するため、
 * ベースカラーや透明度に依存せず鮮明な虹色が出る。
 */

/** フラグメントシェーダー先頭に追加する uniform 宣言。 */
export const thinFilmUniforms = /* glsl */`
  uniform float uFilmThickness;
  uniform float uFilmIOR;
  uniform float uIridStrength;
`;

/**
 * 二光束干渉モデルによる薄膜の分光反射率を返す GLSL 関数。
 *
 * 空気（IOR=1）→薄膜（filmIOR）→基材（PE: IOR=1.46）の
 * 二界面での反射光を合成する。波長は RGB の代表値を使用。
 *
 * @param cosTheta   abs(dot(N, V))
 * @param thickness  膜厚（nm）
 * @param filmIOR    薄膜の屈折率
 * @returns          干渉強度 RGB [0, 1]
 */
export const thinFilmFn = /* glsl */`
vec3 thinFilmColor(float cosTheta, float thickness, float filmIOR) {
  // スネルの法則で膜内の屈折角を求める
  float sinSqFilm = max(0.0, 1.0 - cosTheta * cosTheta) / (filmIOR * filmIOR);
  float cosFilm   = sqrt(max(0.0, 1.0 - sinSqFilm));

  // 光路差（nm）
  float opd = 2.0 * filmIOR * thickness * cosFilm;

  // 各色の位相差（R=680nm, G=550nm, B=450nm）
  vec3 phi = (6.28318530718 * opd) / vec3(680.0, 550.0, 450.0);

  // 各界面のフレネル反射振幅（s偏光近似）
  // r01: 空気 → 薄膜
  // r12: 薄膜 → PE基材（IOR 1.46）
  float r01 = (1.0     - filmIOR) / (1.0     + filmIOR);
  float r12 = (filmIOR - 1.46   ) / (filmIOR + 1.46   );

  // 二光束干渉強度: I = r01² + r12² + 2·r01·r12·cos(φ)
  vec3 irid = r01*r01 + r12*r12 + 2.0*r01*r12 * cos(phi);

  // ピーク値で正規化して [0, 1] に収める
  float peak = r01*r01 + r12*r12 + 2.0*abs(r01*r12);
  return clamp(irid / peak, 0.0, 1.0);
}
`;

/**
 * フラグメントシェーダー末尾（#include <dithering_fragment> の直後）に
 * 注入するスニペット。gl_FragColor に加算して虹彩を合成する。
 *
 * 膜厚をワールド座標で微妙に変化させることで、製造上の厚みムラ
 * （＝実際の農業用ビニールに現れる不均一な虹模様）を再現する。
 */
export const thinFilmInject = /* glsl */`
  {
    vec3  N     = normalize(vNormal);
    vec3  V     = normalize(vViewPosition);
    float NdotV = abs(dot(N, V));

    // ワールド座標で膜厚を空間変調（カメラに追随しない固定パターン）
    float variation = 130.0 * (
      sin(vWorldPosition.x * 1.8 + vWorldPosition.y * 1.4) * 0.5 +
      cos(vWorldPosition.y * 2.2 + vWorldPosition.z * 1.0) * 0.5
    );
    float filmT = clamp(uFilmThickness + variation, 80.0, 800.0);

    vec3  irid = thinFilmColor(NdotV, filmT, uFilmIOR);

    // フレネル包絡：浅い角度ほど干渉色が強くなる（物理的に正しい）
    float fresnel = pow(1.0 - NdotV, 1.4) * 0.65 + 0.35;

    gl_FragColor.rgb += irid * fresnel * uIridStrength;
  }
`;
