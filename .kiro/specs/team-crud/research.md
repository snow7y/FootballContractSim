# Research & Design Decisions

## Summary
- **Feature**: team-crud
- **Discovery Scope**: Simple Addition
- **Key Findings**:
  - 既存の Player 管理は Next.js App Router + Prisma + MySQL で一覧・編集・削除を一貫したパターンで実装されている。
  - players 機能は `/src/app/players` 配下の UI、`/src/app/api/players` 配下の API ルート、Prisma の `Player` モデルが疎結合に構成されている。
  - チーム CRUD は Player と同様のパターンで独立した Team ドメインを持たせることで、将来のリーグ・財政シミュレーションへの拡張が容易になる。

## Research Log

### 既存 CRUD 機能パターン（players）
- **Context**: チーム CRUD を追加する際に、既存の一覧・編集 UI と API のパターンを踏襲する必要があるため。
- **Sources Consulted**:
  - `src/app/players/page.tsx`
  - `src/app/players/PlayerTable.tsx`
  - `src/app/players/actions.ts`
  - `src/app/api/players/route.ts`
  - `src/app/api/players/[id]/route.ts`
- **Findings**:
  - サーバコンポーネントで Prisma を直接呼び出し、初期一覧を取得してクライアントコンポーネントに渡す構成になっている。
  - クライアント側のテーブルコンポーネントは `useTransition` を用いて削除・更新に対する UI の反応性を確保している。
  - サーバアクションは入力バリデーションと Prisma 操作を一箇所にまとめ、`revalidatePath('/players')` で UI と API の一貫性を保っている。
  - API ルートは BFF として、一覧・作成・更新・削除の HTTP インターフェイスを提供しており、フォーム送信以外のクライアント（将来の外部連携など）とも親和性がある。
- **Implications**:
  - Team CRUD も `/src/app/teams` と `/src/app/api/teams` による同等の境界と責務分割を採用することで、学習コストと実装コストを最小化できる。
  - サーバアクション + API ルートを併用する設計とし、UI からは主にサーバアクションを利用しつつ、API は将来の統合ポイントとして維持する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Vertical Slice per Feature | `players` と同様に `teams` ごとに UI / API / ドメインを縦にまとめる | 機能単位で見通しが良く、拡張しやすい | 機能が増えると似た構造が増える | 既存構造・steering に一致するため採用 |
| Shared Generic CRUD Layer | 汎用 CRUD コンポーネントを抽象化して共通化 | 重複削減の余地 | 現段階では抽象化コストが高く、柔軟性を失う | 将来のリファクタ候補とし、現時点では見送り |

## Design Decisions

### Decision: Team ドメインを Player と並列の縦割り構造で追加する
- **Context**: チーム CRUD を追加しつつ、既存の players 機能との一貫性と学習コストの低さを維持したい。
- **Alternatives Considered**:
  1. players と同一モジュール内に Team を混在させる
  2. `/teams` という新たな縦割り機能ディレクトリを追加する
- **Selected Approach**: Option 2 を採用し、`/src/app/teams`（UI）、`/src/app/api/teams`（HTTP API）と Prisma の `Team` モデルで独立した境界を持つ。
- **Rationale**: steering の「機能別 UI / ルート」パターンと整合し、将来のリーグ・財政機能との関連付けが明確になる。
- **Trade-offs**: players と似た構造が増えるが、現段階では重複よりも可読性と単純さを優先する。
- **Follow-up**: 将来ドメイン数が増えた段階で、共通 CRUD テーブル・フォームコンポーネントの抽象化を検討する。

### Decision: Prisma に Team モデルを追加し、選手とチームを疎結合に保つ
- **Context**: チーム情報を独立したエンティティとして管理しつつ、将来 Player との関連（所属クラブなど）をより厳密にモデル化したい。
- **Alternatives Considered**:
  1. Player の文字列フィールド（currentClub）だけでチームを表現し続ける
  2. Team モデルを追加し、Player とは将来のリレーションを前提に設計する
- **Selected Approach**: Option 2 を選択し、`Team` は独立したテーブルとして設計するが、初期段階では Player との外部キー制約は必須としない。
- **Rationale**: チーム CRUD の価値を独立して提供しつつ、シミュレーション機能拡張の余地を残せる。
- **Trade-offs**: 初期実装では Player と Team が完全には正規化されず、一時的な二重管理が生じる可能性がある。
- **Follow-up**: リーグ・シーズン機能追加時に Player と Team 間の外部キーや中間テーブル設計を検討する。

## Risks & Mitigations
- players と teams の実装差異により UX が不整合になるリスク — UI パターン（テーブル + 編集 + 削除 + 新規フォーム）を共通化するガイドラインを設計で明示する。
- Team モデルと既存 Player.currentClub の不整合 — 当面はビジネス上の重要度が低いため許容し、将来の移行タスクを前提とする。
- Prisma スキーマ拡張時のマイグレーション失敗 — 事前にローカルで `prisma migrate dev` を用いた検証を行う運用を前提とする。

## References
- `src/app/players/page.tsx` — 既存 CRUD UI パターン
- `src/app/api/players/route.ts` — 一覧・作成 API パターン
- `src/app/api/players/[id]/route.ts` — 個別取得・更新・削除 API パターン
- `.kiro/steering/structure.md` — App Router + 機能別ディレクトリ構成の方針
