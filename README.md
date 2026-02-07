# SOTA Peak Finder - 世界中のSOTA山頂を検索

[![GitHub Pages](https://img.shields.io/badge/demo-live-success)](https://matsubo.github.io/offline-qth/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SOTAアクティベーター向けに開発された、**オフラインで動作する**SOTA山頂検索PWA（Progressive Web App）です。

**対応地域：全世界（179,000+ 山頂）**

インターネット接続がない山でも、GPS位置情報から最寄りのSOTA山頂を自動表示します。

## 特徴

- **全世界対応**: SOTA公式データベースの179,000以上の山頂に対応
- **完全オフライン対応**: 一度アクセスすればインターネット接続なしで完全動作
- **PWA対応**: ホーム画面に追加してアプリとして使用可能
- **GPS山頂検索**: GPS位置情報から最寄りのSOTA山頂（最大20件）を距離付きで表示
- **詳細な山頂情報**: 参照番号、山名、標高、ポイント、距離、方位、アクティベーションゾーン判定
- **高速検索**: SQLite WASM + R*Tree空間インデックスでサブ10msのクエリ速度
- **グリッドロケーター**: Maidenhead Locator System (6桁) を自動計算
- **JCC/JCG対応**: 日本国内の位置情報に対応
- **軽量**: 44MBのコンパクトなデータベースで高速動作

## 🚀 デモ

**[https://matsubo.github.io/offline-qth/](https://matsubo.github.io/offline-qth/)**

初回アクセス時にすべてのファイルがキャッシュされ、以降はオフラインでも使用できます。

## 📱 使い方

1. https://matsubo.github.io/offline-qth/ にアクセス
2. 「現在地を取得」ボタンをタップ
3. 位置情報の許可を求められたら「許可」を選択
4. 以下の情報が表示されます：
   - 緯度・経度
   - **標高**（GPS または国土地理院API）
   - **都道府県・市区町村**（OpenStreetMap API、オンライン時）
   - グリッドロケーター（Maidenhead 6桁）
   - JCC（Japan Century City、日本国内のみ）
   - JCG（Japan Century Gun、日本国内のみ）
   - **SOTA山頂情報**（最寄りの山頂20件、参照番号・距離・標高・ポイント・方位・アクティベーションゾーン判定付き）

### ホーム画面に追加（推奨）

#### iOS (Safari)
1. Safari でサイトを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択

#### Android (Chrome)
1. Chrome でサイトを開く
2. メニューから「ホーム画面に追加」を選択

## 開発

### セットアップ

```bash
# 依存関係のインストール
bun install
```

### ローカルで実行

```bash
# 開発サーバーを起動
bun run dev
```

ブラウザで `http://localhost:5173` を開く

### プレビュー（本番ビルドの確認）

```bash
# ビルド
bun run build

# プレビュー
bun run preview
```

### データの更新

JCC/JCGデータは `data/location-data.json` に格納されています。

```json
{
  "locations": [
    {
      "lat": 35.6895,
      "lon": 139.6917,
      "prefecture": "東京都",
      "city": "千代田区",
      "jcc": "1001",
      "jcg": "10001"
    }
  ]
}
```

より詳細なデータを追加することで精度が向上します。

## 📖 詳細ドキュメント

- **[仕組みの解説](https://matsubo.github.io/offline-qth/how-it-works.html)** - グリッドロケーター、標高、逆ジオコーディングの計算ロジック
- **[セットアップガイド](SETUP.md)** - ローカル開発とデプロイ手順

## 🚢 GitHub Pagesへのデプロイ

このリポジトリは GitHub Actions で自動デプロイされます。

### 初回セットアップ

1. GitHubリポジトリを作成
2. コードをプッシュ
   ```bash
   git remote add origin https://github.com/あなたのユーザー名/offline-qth.git
   git push -u origin main
   ```
3. GitHub リポジトリの Settings > Pages で以下を設定：
   - **Source**: GitHub Actions
4. 自動的にデプロイされます

### 自動デプロイ

`main` ブランチにプッシュすると、GitHub Actions が自動的に GitHub Pages にデプロイします。

`.github/workflows/deploy.yml` にワークフローが定義されています。

## 🛠️ 技術スタック

- **フロントエンド**: React + TypeScript
- **ビルドツール**: Vite
- **PWA**: Service Worker (vite-plugin-pwa)、manifest.json
- **位置情報**: Geolocation API
- **標高API**: 国土地理院
- **住所API**: OpenStreetMap Nominatim
- **デプロイ**: GitHub Pages + GitHub Actions
- **SEO**: 構造化データ（JSON-LD）、Open Graph、Twitter Cards

## 🎨 デザインシステム

### Technical Cartography デザイン

アマチュア無線の山岳運用に最適化された、**ヴィンテージ無線機器**と**地形図**を融合させた独自のデザインシステムを採用しています。

#### デザインコンセプト

- **Technical Cartography（技術的地図学）**: アナログ無線機器のCRTディスプレイと地形図の等高線を組み合わせた美学
- **高視認性**: 屋外の日光下でも読みやすい高コントラスト設計
- **情報密度**: 必要なデータを整理して効率的に表示
- **テクニカル感**: アマチュア無線のカルチャーに合致した技術的な外観

#### タイポグラフィ

| 用途 | フォント | 特徴 |
|------|---------|------|
| 見出し | Rajdhani | テクニカルで力強い、大文字強調 |
| データ/数値 | JetBrains Mono | 等幅フォント、コード・座標表示に最適 |
| 本文 | DM Sans | 読みやすく洗練された sans-serif |

#### カラーパレット

```css
/* Technical Cartography Color System */
--bg-base: rgb(12, 16, 24)           /* ベース背景 */
--bg-panel: rgb(18, 24, 36)          /* パネル背景 */
--accent-amber: rgb(255, 169, 51)    /* アンバー（主要アクセント） */
--accent-teal: rgb(51, 204, 204)     /* ティール（グリッド線・ラベル） */
--accent-green: rgb(102, 255, 153)   /* グリーン（ステータス・SOTA） */
```

**色の使い分け:**
- 🟠 **アンバー**: プライマリボタン、重要な数値（Grid Locator, JCC, JCG）
- 🔵 **ティール**: グリッド線、技術的なラベル、セクション区切り
- 🟢 **グリーン**: GPS座標、アクティブ状態、範囲内表示

#### ビジュアルエフェクト

1. **地形図背景**
   - 等高線パターン（50px間隔）
   - 対角グリッド線（100px間隔）
   - 放射状グラデーション

2. **CRTスキャンライン**
   - 微細な水平線（4px間隔）
   - ヴィンテージモニター風の質感

3. **グロー効果**
   - テキストにネオンのような発光効果
   - アンバー/ティール/グリーンの色別グロー

4. **テクニカルボーダー**
   - コーナーアクセント装飾
   - セクション別の色分け左ボーダー
   - 二重ボーダー効果

#### コンポーネントスタイル

**カード（.card-technical）**
```
- 半透明背景（背景ぼかし効果）
- ティールボーダー
- 上部グラデーションライン
- コーナー装飾
```

**データパネル（.data-panel）**
```
- ダークオーバーレイ
- 微細なグリッドパターン
- テクニカルな境界線
```

**プライマリボタン（.btn-primary）**
```
- アンバーグラデーション
- グロー効果
- ホバー時のシマーアニメーション
- 内側ハイライト
```

#### レスポンシブ設計

- モバイルファースト
- タッチ操作に最適化されたボタンサイズ
- グリッドレイアウトの柔軟な切り替え
- 小画面でも情報が見やすい配置

#### アクセシビリティ

- WCAG 2.1 AAレベルのコントラスト比
- 明確な視覚的階層
- 読みやすいフォントサイズ（最小10px）
- セマンティックHTML構造

### カスタマイズ

CSS変数（`src/index.css`）を編集することで、色やエフェクトの調整が可能：

```css
:root {
  --bg-base: 12, 16, 24;           /* 背景色を変更 */
  --accent-amber: 255, 169, 51;    /* アクセントカラーを変更 */
  --accent-teal: 51, 204, 204;     /* グリッド色を変更 */
}
```

## TODO

- [ ] より詳細なJCC/JCGデータベースの追加
- [ ] 市区町村境界データの精度向上
- [ ] 標高情報の表示
- [ ] QTH履歴の保存機能
- [ ] ダークモード対応

## ライセンス

MIT License

## 貢献

プルリクエスト、Issue、フィードバックを歓迎します！

特にJCC/JCGデータの拡充にご協力いただける方を募集しています。

## アマチュア無線について

### JCC/JCG
JCC（Japan Century City）とJCG（Japan Century Gun）は、日本国内の市区町村・郡に割り当てられた識別番号で、アマチュア無線のアワード（賞）取得に使用されます。

### グリッドロケーター
グリッドロケーター（Maidenhead Locator System）は、地球上の位置を表す世界共通の座標系です。6桁の英数字（例：PM95vr）で位置を表現し、VHF/UHF帯のコンテストやDXでよく使用されます。

## 👨‍💻 作者

**JE1WFV**
- X (Twitter): [@je1wfv](https://x.com/je1wfv)
- GitHub: [matsubo/offline-qth](https://github.com/matsubo/offline-qth)

## 73!

Good DX & Happy Trails!
