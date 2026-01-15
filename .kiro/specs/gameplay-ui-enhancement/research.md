# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: gameplay-ui-enhancement
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存の契約フローは `ContractFlow` に集約されており、ホーム画面での体験強化は同コンポーネント拡張が最小変更。
  - サーバアクション + Prisma を用いた BFF パターンが確立されており、進行状態や履歴は同パターンで永続化可能。
  - UI は Tailwind ベースで統一されており、ダッシュボード表現はホーム画面のカード型レイアウトに適合する。

## Research Log

### 既存 UI と契約フローの拡張点
- **Context**: フェーズ可視化・行動フィードバック・スコア提示を既存画面に統合するための拡張点が必要。
- **Sources Consulted**: `src/app/page.tsx`, `src/app/contracts/ContractFlow.tsx`, `src/app/contracts/contract-actions.ts`
- **Findings**:
  - 契約開始から確定までの UI は `ContractFlow` が担い、ホーム画面はそれを配置する構成。
  - 契約作成は `createContract` に集約されており、成功/失敗メッセージは UI 側で保持。
- **Implications**: 進行状態とアクション履歴は `ContractFlow` と新規サーバアクションで統合し、ホーム画面はダッシュボードカードの配置に専念する設計が適切。

### 永続化とユーザー文脈の扱い
- **Context**: 進行状態の復元と履歴参照を満たすための永続化戦略が必要。
- **Sources Consulted**: `src/app/contracts/user-actions.ts`, `prisma/schema.prisma`
- **Findings**:
  - ユーザー文脈は Cookie による `User` モデル連携で確立済み。
  - Prisma/MySQL の既存スキーマに新規モデル追加で履歴の保存が可能。
- **Implications**: 進行状態・アクション履歴・スコアはユーザー単位で保存し、再訪時に再構築する設計が要件に適合。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 現行 BFF 拡張 | 既存の App Router + Server Actions を拡張 | 既存パターン維持、最小変更 | サーバアクション増加による分散 | 既存設計と整合するため採用 |
| 新規 API 層分離 | API ルートを独立させる | 明確な分離 | 既存構造と乖離、変更量増大 | 採用しない |

## Design Decisions

### Decision: 進行状態と履歴を DB 永続化
- **Context**: 1.4 と 1.5 の要件で再訪復元と履歴参照が必要。
- **Alternatives Considered**:
  1. LocalStorage のみ — クライアント完結
  2. DB 永続化 — ユーザー単位でサーバ保存
- **Selected Approach**: DB 永続化で `GameplayPhaseState` と `ActionLog` を保持。
- **Rationale**: ユーザー文脈が既に存在し、再訪・履歴要件に確実に対応できる。
- **Trade-offs**: スキーマ追加とサーバアクション増加。
- **Follow-up**: マイグレーションと最小取得により性能劣化を抑制。

### Decision: 既存 `ContractFlow` を中核に UI 拡張
- **Context**: 主要体験はホーム画面内の契約フローに集中している。
- **Alternatives Considered**:
  1. 新規ページ分割
  2. `ContractFlow` を拡張
- **Selected Approach**: `ContractFlow` を拡張し、周辺パネルを追加。
- **Rationale**: 変更範囲が限定され、既存 UX を崩さず拡張できる。
- **Trade-offs**: コンポーネント肥大化の懸念。
- **Follow-up**: パネルコンポーネント分割で責務を分離。

## Risks & Mitigations
- 進行状態の整合性 — フェーズ更新をサーバ側で検証し、UI からは遷移要求のみ送る。
- UI 情報量の増加 — ダッシュボードカードとパネルを分離し、空状態ガイダンスを標準化。
- パフォーマンス劣化 — ホーム画面の初期取得を集約し、履歴はページングで取得。

## References
- `src/app/page.tsx` — ホーム画面構成
- `src/app/contracts/ContractFlow.tsx` — 契約フロー UI
- `src/app/contracts/contract-actions.ts` — 契約作成アクション
- `src/app/contracts/user-actions.ts` — ユーザー文脈
- `prisma/schema.prisma` — 既存データモデル
