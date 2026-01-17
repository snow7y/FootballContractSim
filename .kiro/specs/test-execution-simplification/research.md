# Research & Design Decisions Template

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `test-execution-simplification`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存のテスト実行は標準的な npm scripts に存在せず、実行入口の統一が必要。
  - リポジトリには tests/ 配下のテスト群があり、対象選択と結果要約の標準化が有効。
  - 新規外部依存を追加せず、Node.js 実行環境と npm scripts の範囲で設計可能。

## Research Log

### 既存の実行入口とパターン
- **Context**: 現行の開発運用に合わせた統一入口が必要。
- **Sources Consulted**: package.json, README.md
- **Findings**:
  - `scripts` にテスト関連コマンドが存在しない。
  - 開発は Dev Container 前提で、Node.js 実行環境は既に整備済み。
- **Implications**: 入口は npm scripts に集約し、CLI 相当の薄いラッパーで統一する。

### テスト配置と対象選択
- **Context**: テスト範囲の指定要件に対応するため。
- **Sources Consulted**: リポジトリ構成（tests/ 配下）
- **Findings**:
  - テストは tests/ 配下に多数存在し、領域・ファイル指定の需要が高い。
- **Implications**: ターゲット解決コンポーネントを分離し、複数指定を統一的に扱う。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Script Orchestrator | npm scripts と Node.js スクリプトで実行フローを統一 | 既存スタックに自然に統合、依存追加なし | シェル依存が増える可能性 | 既存運用と整合 | 
| Dedicated Test Runner | 新規ライブラリ導入で高機能化 | 高度な機能を提供 | 依存増、運用コスト増 | 今回は対象外 |

## Design Decisions

### Decision: 単一入口としての CLI ラッパー
- **Context**: 実行モードの統一と可視化の要件。
- **Alternatives Considered**:
  1. npm scripts のみで表現
  2. Node.js スクリプトを単一入口として提供
- **Selected Approach**: npm scripts から呼び出される CLI ラッパーを設計し、モード・対象・出力形式を標準化する。
- **Rationale**: 既存の Node.js 実行環境を活用し、依存追加なしで一貫性を確保できる。
- **Trade-offs**: コマンド構成の整理が必要。
- **Follow-up**: 実行対象の解決ルールと CI 既定セットの合意。

### Decision: 事前検証の共通化
- **Context**: ローカル・CI で同一の前提検証を要求。
- **Alternatives Considered**:
  1. 実行モードごとに個別検証
  2. 共通プリフライト検証
- **Selected Approach**: 共通の PreflightValidator を設計して両モードで利用。
- **Rationale**: 要件 4.3 を満たしつつ、失敗原因の統一的な提示ができる。
- **Trade-offs**: 検証項目の共通化に伴う定義コスト。
- **Follow-up**: どの前提を必須とするかの最終決定。

## Risks & Mitigations
- 既定テストセットの合意不足 — 要件レビュー時に範囲を明確化する。
- 出力形式のばらつき — 出力フォーマットの仕様を共通化し、機械可読出力の定義を固定する。
- 運用スクリプトの増加 — 入口統一により、開発者が参照するコマンド数を最小化する。

## References
- [package.json](package.json) — 既存の scripts と依存関係確認
- [README.md](README.md) — 開発運用と実行環境の前提
