# バージョン管理ガイド

## バージョンの更新方法

このプロジェクトでは、`package.json` のバージョンが単一の情報源（Single Source of Truth）です。

### バージョンを更新するには：

```bash
# パッチバージョンアップ (2.1.0 → 2.1.1) - バグフィックス
bun run version:patch

# マイナーバージョンアップ (2.1.0 → 2.2.0) - 新機能
bun run version:minor

# メジャーバージョンアップ (2.1.0 → 3.0.0) - 破壊的変更
bun run version:major

# または手動で package.json を編集
# "version": "2.1.0" → "version": "2.2.0"
```

### 自動的に反映される場所：

- ✅ アプリのフッター（v2.1.0 と表示）
- ✅ ビルド時に `__APP_VERSION__` としてグローバルに注入
- ✅ TypeScript の型定義も自動生成

### セマンティックバージョニング

- **MAJOR (3.0.0)**: 破壊的変更
  - 例: API の大幅な変更、非互換な変更

- **MINOR (2.1.0)**: 新機能追加
  - 例: 新しい言語対応、新機能の追加

- **PATCH (2.0.1)**: バグ修正
  - 例: バグ修正、小さな改善

## 更新手順

1. バージョンを更新:
   ```bash
   bun run version:minor
   ```

2. ビルド:
   ```bash
   bun run build
   ```

3. コミット & タグ作成（npm version が自動的に行います）:
   ```bash
   git push && git push --tags
   ```

## 現在のバージョン確認

```bash
# package.json から確認
cat package.json | grep version

# または
bun run --version
```

## 変更履歴

### v2.3.1 (2026-02-06)
- プログラマティックSEO実装（9,000+ページ対応）
- 翻訳ファイルの正しいインポート（src/localesに移動）
- pre-commit linting（Husky + lint-staged）の追加
- LocationPage型定義の修正
- react-helmet-async追加（SEOメタタグ対応）

### v2.1.0 (2024-02-03)
- バージョン自動管理システムの追加
- l10n問題の修正
- PWAキャッシュ処理の改善

### v2.0.0 (2024-02-03)
- React + TypeScript + Tailwind CSS への完全書き直し
- Bun対応
- E2Eテスト追加
- i18n/l10n対応（日本語・英語）
