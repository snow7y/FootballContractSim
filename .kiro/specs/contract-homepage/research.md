# Research & Design Decisions Template

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `contract-homepage`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存の App Router 構成では、`/src/app/players` と `/src/app/teams` にページ・フォーム・サーバーアクションを集約するパターンがある。
  - ルートのホーム画面はテンプレートのままで、機能実装の拡張ポイントになっている。
  - データアクセスは Prisma を直接利用し、フォーム操作は Server Actions で行う方針が既存実装と整合する。
  - 現状のコードベースには認証/ユーザー概念が存在せず、ユーザー単位の分離は新規に「ユーザー識別の仕組み」と「データスコープ制御」を導入する必要がある。

## Research Log

### 既存画面の拡張ポイント
- **Context**: ホーム画面への契約フロー統合方法を検討
- **Sources Consulted**: `src/app/page.tsx`, `src/app/players/page.tsx`, `src/app/teams/page.tsx`
- **Findings**:
  - ホームはプレースホルダ UI で、機能要件に合わせた置き換えが必要
  - `players` / `teams` のページは Server Component で Prisma を直接呼び出している
- **Implications**: ホーム画面は Server Component とし、契約フロー UI は Client Component で分離する構成が自然

### データ操作パターン
- **Context**: 契約作成時の操作方式を決定
- **Sources Consulted**: `src/app/players/actions.ts`, `src/app/teams/actions.ts`
- **Findings**:
  - フォーム送信は Server Actions を用いて実装されている
  - バリデーションはサーバー側で行い、失敗時はエラーを投げて UI で表示する
- **Implications**: 契約作成も Server Actions を採用し、同様のバリデーション・エラー伝播に統一する

### ユーザー分離の実現方法
- **Context**: 契約をユーザー単位で独立させる必要が発生
- **Sources Consulted**: 既存実装の範囲（認証なし）、フォーム/Server Actions パターン
- **Findings**:
  - 認証基盤が未導入のため、最小構成では「現在ユーザー」を選択/保持する仕組みが必要
  - 分離の本質は、契約データに `userId` を付与し、参照/作成を常に `userId` でスコープすること
- **Implications**: まずはユーザー選択（例: Cookie/Session による currentUser）+ `Contract.userId` で分離し、将来の認証導入に置き換え可能な境界を設ける

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Server Actions 중심 | Server Actions で契約作成と検証を行う | 既存パターンと整合、実装が簡潔 | クライアント側の細かな制御が必要 | 既存 UI/Action と同様の運用が可能 |
| API Route 중심 | ルートハンドラ API を用いて契約作成 | API テストが容易 | 既存実装と二重パターンになる | 既存構成との差分が増える |

## Design Decisions

### Decision: 契約作成は Server Actions を採用
- **Context**: 既存のフォーム処理は Server Actions が主流
- **Alternatives Considered**:
  1. API Route を新規追加
  2. Server Actions で統一
- **Selected Approach**: Server Actions で `createContract` を提供
- **Rationale**: 既存の `players` / `teams` と同じ運用・テスト戦略に寄せるため
- **Trade-offs**: API レイヤの再利用性は下がるが、UI 実装の一貫性を優先
- **Follow-up**: テストで Server Actions のエラーハンドリングを確認

### Decision: Contract モデルを新規追加
- **Context**: 契約確定の結果を永続化する必要がある
- **Alternatives Considered**:
  1. 既存 `Player` に契約情報を埋め込む
  2. 独立した `Contract` を作成する
- **Selected Approach**: `Contract` モデルを追加し `Player` / `Team` と関連付ける
- **Rationale**: 将来の履歴管理や複数契約の拡張を見据えた構造にするため
- **Trade-offs**: マイグレーションが必要になる
- **Follow-up**: 既存のシードデータに契約を追加するかは実装段階で判断

### Decision: ユーザー分離は UserContext + Contract.userId で担保
- **Context**: 「契約周りをユーザーごとに独立」させる要望
- **Alternatives Considered**:
  1. 認証（ログイン）を導入してセッションに紐付ける
  2. 認証なしで currentUser を選択し、Cookie 等で保持する
- **Selected Approach**: まずは認証なしで currentUser を識別できる UserContext を導入し、`Contract.userId` に紐付けて分離する
- **Rationale**: 既存が単一ユーザー前提であり、認証導入はスコープが大きいため。データ層での分離（userIdスコープ）を先に確立しておく
- **Trade-offs**: セキュリティは担保されないため、実運用のマルチユーザーには認証が必要
- **Follow-up**: 将来的な認証導入時に `UserContextService.getCurrentUser()` の実装差し替えで移行できることを確認

## Risks & Mitigations
- 既存ホーム画面の UI 置き換えによる遷移導線の混乱 — 既存の `players` / `teams` へのリンクを残す
- 契約入力のバリデーション不足 — サーバー側で必須条件を明確化し、UI 側で即時フィードバックを表示
- 契約データ追加に伴うマイグレーション工数 — 影響範囲を `Contract` のみへ限定し段階的に追加

## References
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Schema](https://www.prisma.io/docs)
