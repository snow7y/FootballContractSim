# プロジェクト構造

## 組織化ポリシー

- Next.js App Router 標準に沿った `app/` ディレクトリ中心の構成
- ドメイン知識（例: ポジション定義）は `src/domain/` にまとめ、UI / インフラ層から分離
- インフラ系の共通処理（例: Prisma クライアント）は `src/lib/` に集約
- 将来的に機能が増えても「ドメイン別」「機能別」に整理しやすい構造を維持する

## ディレクトリパターン

### Next.js アプリケーション層
**場所**: `/src/app/`
**目的**: ルーティング・ページコンポーネント・API ルートをまとめる Next.js 標準のエントリポイント
**例**:
- ルートページ: `/src/app/page.tsx`
- レイアウト: `/src/app/layout.tsx`
- グローバルスタイル: `/src/app/globals.css`

### 機能別 UI / ルート
**場所**: `/src/app/players/`
**目的**: 選手一覧・作成フォームなど「players」機能に紐づく画面・UI コンポーネント・アクションを集約
**例**:
- ページコンポーネント: `/src/app/players/page.tsx`
- UI コンポーネント: `/src/app/players/PlayerTable.tsx`, `/src/app/players/CreatePlayerForm.tsx`
- サーバアクション: `/src/app/players/actions.ts`

### API ルート
**場所**: `/src/app/api/players/`
**目的**: Player ドメインに対する HTTP API（一覧取得、作成、更新など）のエンドポイント
**例**:
- 一覧 / 作成: `/src/app/api/players/route.ts`
- 個別操作: `/src/app/api/players/[id]/route.ts`

> App Router の `route.ts` を用いることで、BFF 的に UI 直下に API を配置するパターンを採用

### ドメインモデル
**場所**: `/src/domain/`
**目的**: アプリケーション固有のドメイン知識（列挙・値オブジェクト・ビジネスルールの土台）を集約
**例**:
- ポジション定義: `/src/domain/positions.ts`

### インフラ / 共通ライブラリ
**場所**: `/src/lib/`
**目的**: Prisma クライアントや外部サービス接続など、インフラ寄りの共通処理
t**例**:
- Prisma クライアント初期化: `/src/lib/prisma.ts`

## 命名規則

- **React コンポーネント**: `PlayerTable.tsx`, `CreatePlayerForm.tsx` のように PascalCase
- **ページファイル**: `page.tsx`, `layout.tsx` など Next.js 規約に従う
- **API ルート**: `route.ts` を用い、パス構造で責務を表現
- **ドメインモジュール**: `positions.ts` のように責務を端的に表す単語 + camelCase / 単数形を基本

## インポート方針

```ts
// 例: ドメイン値を UI 層から利用
import { POSITIONS } from '@/domain/positions'

// 例: Prisma クライアントをサーバ側ロジックから利用
import { prisma } from '@/lib/prisma'
```

- App Router プロジェクトで一般的な `@/` エイリアスを用いて、`src/` 直下への絶対インポートを行う
- 階層が近い場合やコンポーネント内限定の依存は、相対パス `./` / `../` を用いる

## コード整理の原則

- ドメイン知識（ポジション、契約ロジックなど）は `domain` に集約し、UI / インフラ層から独立させる
- 1 つのディレクトリは 1 つの概念（機能 or レイヤ）にフォーカスさせる
- 新しい機能を追加する場合は、まず「どのドメイン or 機能ディレクトリに属するか」を決めてからファイルを置く

---
_個々のファイル列挙ではなく、「App Router + ドメイン分離」を軸とした構造パターンを記録する_