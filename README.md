# オフラインQTH - JCC/JCG検索ツール

[![GitHub Pages](https://img.shields.io/badge/demo-live-success)](https://matsubo.github.io/offline-qth/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

アマチュア無線の山岳運用向けに開発された、**オフラインで動作する**JCC/JCG/グリッドロケーター検索PWA（Progressive Web App）です。

インターネット接続がない山でも、GPS位置情報からQTH情報を自動表示します。

## 特徴

- **オフライン対応**: 一度アクセスすればインターネット接続なしで基本動作
- **PWA対応**: ホーム画面に追加してアプリとして使用可能
- **位置情報から自動判定**: GPS位置情報からJCC/JCG/グリッドロケーターを自動表示
- **グリッドロケーター**: Maidenhead Locator System (6桁) を自動計算
- **標高表示**: 国土地理院APIで正確な標高を取得（オンライン時）
- **正確な住所**: OpenStreetMap APIで都道府県・市区町村を取得（オンライン時）
- **軽量**: データをローカルに持つため高速動作

## 🚀 デモ

**[https://matsubo.github.io/offline-qth/](https://matsubo.github.io/offline-qth/)**

初回アクセス時にすべてのファイルがキャッシュされ、以降はオフラインでも使用できます。

## 📱 使い方

1. https://matsubo.github.io/offline-qth/ にアクセス
2. 「現在地を取得」ボタンをタップ
3. 位置情報の許可を求められたら「許可」を選択
4. 以下の情報が表示されます：
   - 緯度・経度
   - **標高**（国土地理院APIで正確な値を取得）
   - **都道府県・市区町村**（OpenStreetMap APIで正確な住所を取得）
   - グリッドロケーター（Maidenhead 6桁）
   - JCC（Japan Century City）
   - JCG（Japan Century Gun）

### ホーム画面に追加（推奨）

#### iOS (Safari)
1. Safari でサイトを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択

#### Android (Chrome)
1. Chrome でサイトを開く
2. メニューから「ホーム画面に追加」を選択

## 開発

### ローカルで実行

```bash
# シンプルなHTTPサーバーで実行
python -m http.server 8000
# または
npx serve
```

ブラウザで `http://localhost:8000` を開く

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

- **フロントエンド**: Pure JavaScript (フレームワーク不要)
- **PWA**: Service Worker、manifest.json
- **位置情報**: Geolocation API
- **標高API**: 国土地理院
- **住所API**: OpenStreetMap Nominatim
- **デプロイ**: GitHub Pages + GitHub Actions
- **SEO**: 構造化データ（JSON-LD）、Open Graph、Twitter Cards

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
