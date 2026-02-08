# セットアップガイド

## 1. アイコンの生成

PWAに必要なアイコン画像を生成します。

```bash
# ブラウザで create-icons.html を開く
open create-icons.html
```

1. `create-icons.html` をブラウザで開く
2. `icon-192.png` と `icon-512.png` をダウンロード
3. ダウンロードしたファイルをプロジェクトのルートディレクトリに配置

または、お好きなアイコン作成ツールで 192x192 と 512x512 のPNG画像を作成してください。

## 2. ローカルでテスト

HTTPSまたはlocalhostで動作する必要があります（Service Worker の制限）。

### Python の場合
```bash
python -m http.server 8000
```

### Node.js の場合
```bash
npx serve
```

### PHP の場合
```bash
php -S localhost:8000
```

ブラウザで `http://localhost:8000` を開いてテストしてください。

## 3. GitHub Pagesへのデプロイ

### 3-1. GitHubリポジトリの作成

```bash
# Gitリポジトリの初期化
git init

# ファイルを追加
git add .

# 初回コミット
git commit -m "Initial commit: Offline QTH PWA"

# GitHubリポジトリと接続（あなたのリポジトリURLに置き換えてください）
git remote add origin https://github.com/あなたのユーザー名/sota-peak-finder.git

# プッシュ
git branch -M main
git push -u origin main
```

### 3-2. GitHub Pagesの有効化

1. GitHubリポジトリのページを開く
2. `Settings` タブをクリック
3. 左メニューから `Pages` を選択
4. `Source` で `main` ブランチを選択
5. `Save` をクリック

数分後、`https://あなたのユーザー名.github.io/sota-peak-finder/` でアクセス可能になります。

## 4. manifest.json の設定確認

`manifest.json` の `start_url` をあなたのリポジトリ名に合わせて変更してください。

```json
{
  "start_url": "/sota-peak-finder/"  // リポジトリ名と一致させる
}
```

リポジトリ名が違う場合は、適宜変更してください。

## 5. Service Worker のパス設定

`service-worker.js` 内のパスも確認してください。GitHub Pagesではリポジトリ名がパスに含まれます。

## 6. JCC/JCGデータの拡充

`data/location-data.json` にJCC/JCGデータを追加していきます。

より詳細なデータがあれば、精度が向上します。

### データの追加方法

```json
{
  "lat": 35.6895,      // 緯度
  "lon": 139.6917,     // 経度
  "prefecture": "東京都",
  "city": "千代田区",
  "jcc": "1001",       // JCCコード
  "jcg": "10001"       // JCGコード
}
```

## トラブルシューティング

### Service Workerが登録されない
- HTTPSまたはlocalhostで実行されているか確認
- ブラウザのコンソールでエラーを確認
- ブラウザのキャッシュをクリア

### 位置情報が取得できない
- ブラウザの位置情報許可を確認
- HTTPSで実行されているか確認（本番環境）
- デバイスのGPS設定を確認

### オフラインで動作しない
- 一度オンラインでアクセスしてキャッシュを作成
- Service Workerが正常に登録されているか確認
- Application > Service Workers で状態を確認（Chrome DevTools）

### GitHub Pagesで404エラー
- リポジトリ名とmanifest.jsonのstart_urlが一致しているか確認
- ブランチ名が正しいか確認
- 数分待ってから再度アクセス

## 開発Tips

### Service Workerのデバッグ
Chrome DevTools > Application > Service Workers で状態確認・アンインストールが可能

### キャッシュのクリア
Chrome DevTools > Application > Storage > Clear site data

### オフラインテスト
Chrome DevTools > Network > Offline にチェックを入れてテスト
