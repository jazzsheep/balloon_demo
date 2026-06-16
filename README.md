# balloon_demo

巨大ビニール風船の風シミュレーション。Three.js と位置ベースVerlet物理で、
カーソルの風に揺れる半透明の膜を描画するブラウザデモ。

## 操作

- **カーソルを風船に当てる** … 当たり点へ風を送って膜をへこませる
- **ドラッグ** … 視点を回転
- **左下パネル** … 風の強さ / 張り（内圧）/ 膜のやわらかさ を調整、形のリセット

## 実行

ES モジュールを使う為、ファイルを直接開くのではなくローカルサーバ経由で開く。

```bash
# 例：いずれか
python3 -m http.server 8000
npx serve
```

ブラウザで `http://localhost:8000/` を開く。Three.js は import map 経由で
CDN（unpkg）から読み込むのでネット接続が必要。

## 構成

責務ごとに ES モジュールへ分割している。

```
index.html              マークアップと import map のみ
css/
  styles.css            スタイル
js/
  main.js               アプリの組み立てと固定ステップのメインループ
  config.js             チューニング値の一元管理
  geometry/
    icosphere.js        共有頂点アイコスフィアの生成
  physics/
    BalloonSimulation.js  Verlet積分・内圧・距離拘束・風の物理本体
    volume.js             閉曲面の符号付き体積
  scene/
    SceneManager.js     レンダラ・シーン・ライティング・リサイズ
    CameraController.js オービットカメラと視点回転
    BalloonMesh.js      Three.js メッシュとマテリアル
  input/
    WindController.js   ポインタ入力（風 / 視点回転）
  ui/
    ControlPanel.js     スライダーとリセットの DOM 配線
```

### 設計の考え方

- **描画と物理の分離** … `BalloonSimulation` は Three.js に依存せず、頂点バッファ
  （`positions`）だけを公開する。`BalloonMesh` がそのバッファを共有して描画する。
- **設定の集約** … 調整したい値は `config.js` に集めてあり、挙動の調整がしやすい。
- **入力の分離** … 風（ホバー）と視点回転（ドラッグ）を `WindController` で振り分ける。
- **薄いオーケストレーション** … `main.js` は各モジュールを束ねてループを回すだけ。
```
