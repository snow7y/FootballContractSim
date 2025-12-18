# 技術スタック

## アーキテクチャ

- Next.js App Router を用いたフルスタック Web アプリケーション
- フロントエンドと API を同一 Next.js プロジェクト内に共存させる BFF スタイル
- Prisma を用いた MySQL への ORM アクセス（スキーマファースト）
- Docker / Dev Container によるコンテナ化された開発・実行環境

## コア技術

- **言語**: TypeScript
- **フレームワーク**: Next.js 15 (App Router, `app/` ディレクトリ構成)
- **UI 実行環境**: React 19
- **ランタイム**: Node.js（コンテナ内、Next.js 標準の実行環境）
- **データベース**: MySQL（Prisma 経由で利用）

## キーライブラリ / ツール

- Prisma / @prisma/client: データアクセス・マイグレーション管理
- Biome: Lint / フォーマッタ統合ツール
- Tailwind CSS v4: グローバルスタイルとユーティリティベースのデザイン適用

## 開発標準

### 型安全

- TypeScript を前提とした実装
- Prisma スキーマと生成クライアントによる DB アクセスの型安全性
- ドメイン値（例: ポジション）には enum や専用モジュールを用いて「文字列のばらまき」を避ける

### コード品質

- Biome によるコードスタイル・静的解析の統一（`npm run lint` / `npm run format`）
- Next.js App Router の推奨パターン（Server Components / Route Handlers）を尊重

### テスト

- 現時点では明示的なテストフレームワークは未定義
- ドメインロジックが増えたら、ユニットテスト（例: Jest / Vitest）でビジネスルールを守る方針を想定

## 開発環境

### 必要ツール（ローカル）

- Docker / Docker Compose：本番相当のアプリ + DB を起動
- VS Code Dev Container: 一貫した Node / npm / LSP 環境を提供

### 主要コマンド

```bash
# 開発サーバ（コンテナ内）
npm run dev

# ビルド
npm run build

# 本番モード起動
npm run start

# Lint / フォーマット
npm run lint
npm run format
```

> コンテナ外からは `docker compose up` でアプリ + DB をまとめて起動する運用を想定

## 主要な技術的判断

- Next.js App Router 採用により、ルーティングとデータフェッチをフレームワーク標準に寄せる
- Prisma + MySQL によってスキーマ駆動でドメインモデル（Player など）を定義し、将来の拡張にも対応しやすくする
- Dev Container を前提とした開発体験により、ホスト OS 差異や node_modules 周りの問題を回避する

---
_依存ライブラリの一覧ではなく、「Next.js + Prisma + MySQL」を中心とした技術選択と運用パターンを記録する_