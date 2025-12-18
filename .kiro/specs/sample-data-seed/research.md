# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.
---

## Summary
- **Feature**: sample-data-seed
- **Discovery Scope**: Extension
- **Key Findings**:
  - FootballContractSim は Next.js App Router + Prisma + MySQL 構成であり、サンプルデータシードは Prisma 経由で Player / Team モデルに対して投入するのが自然である。
  - 既存コードベースにはシード処理が存在しないため、新たにサンプルデータシードのエントリポイントと実行方法（スクリプトまたは専用ランナー）を設計する必要がある。
  - サンプルデータは開発・検証環境での利用を前提とし、本番相当環境では安全にブロックまたは明示的制御を行う設計が求められる。

## Research Log

### 既存ドメインとデータモデルの確認
- **Context**: サンプルデータでどのエンティティを対象にするかを明確にするため。
- **Sources Consulted**:
  - prisma/schema.prisma
  - .kiro/steering/product.md / tech.md / structure.md
- **Findings**:
  - Player モデルはポジション enum、年齢、overall / potential、marketValue など契約シミュレーションのコア属性をすでに持っている。
  - Team モデルは名称や国、設立年といった基本情報のみを持ち、Player とのリレーションはスキーマ上は未定義だが、ユースケースとしては「所属クラブ」をサンプルデータで再現する必要がある。
  - プロジェクト構造では Prisma クライアントは src/lib/prisma.ts に集約されており、サンプルデータシードもこれを利用する形で実行するのが整合的である。
- **Implications**:
  - シード処理は Player / Team 両方に対して代表的なレコードを生成し、Player.currentClub など既存フィールドを使ってチームとの関連性を表現する設計とする。
  - Prisma スキーマの変更を伴うサンプルデータシードは本仕様のスコープ外とし、現状のモデルで表現できる範囲に留める。

### 拡張ポイントと実行形態
- **Context**: サンプルデータシードをどのような形で実行可能にするか（スクリプト／タスク／API など）を検討するため。
- **Sources Consulted**:
  - package.json
  - src/lib/prisma.ts（Prisma クライアント初期化方針の確認を想定）
- **Findings**:
  - プロジェクトは Dev Container + Docker を利用しており、CI やローカル開発環境で node コマンド経由のスクリプト実行が容易である。
  - サンプルデータシードは UI や HTTP API から常時利用される機能ではなく、「開発・テスト用のセットアップ手順」の一部として CLI 的に実行される形が適合する。
- **Implications**:
  - Node スクリプト（例: scripts/sample-data-seed.ts）を用意し、Prisma クライアントを利用してサンプルデータを投入する構成を前提とした設計とする。
  - 必要に応じて package.json にシード実行用 npm script を定義することを、設計上の推奨として明記する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単純なスクリプトベースのシード | Prisma クライアントを利用する 1 本のスクリプトから Player / Team にサンプルデータを投入する | 実装が単純で学習コストが低い / 既存スタックと整合 | スクリプトが肥大化すると保守が難しくなる / 実行条件や環境制御の責務が集中する | 現状は件数・複雑さが限定的なため、この方式で十分と判断 |
| ドメインサービス + バッチジョブ | ドメインサービスを切り出し、バッチジョブや管理 UI から再利用する | 将来の拡張（管理画面からのサンプル投入など）に発展しやすい | 初期実装としてはオーバーエンジニアリングになり得る | 本仕様では将来の拡張余地としてのみ言及し、今回は採用しない |

## Design Decisions

### Decision: Prisma を用いた単一シードスクリプト構成
- **Context**: Player / Team に対して代表的なサンプルデータを投入する最初の仕組みが必要。
- **Alternatives Considered**:
  1. Next.js API ルート経由でシード処理を実行する
  2. Node スクリプトとして Prisma を直接呼び出す
- **Selected Approach**: Node スクリプトとして Prisma クライアントを呼び出し、DB に直接サンプルデータを投入する方式を採用する。
- **Rationale**: 本番相当環境での誤実行リスクを CLI レベルで制御しやすく、HTTP 公開面積を増やさずに済むため。Dev Container / CI からも簡単に呼び出せる。
- **Trade-offs**: Web UI からのワンクリック投入などを行う場合には別途エンドポイントや管理 UI が必要となる。
- **Follow-up**: 実装フェーズで実行環境判定ロジックと、将来的な UI 連携に備えたサービス境界の切り出し可能性を検討する。

## Risks & Mitigations
- サンプルデータ件数の増加によりスクリプト実行時間が伸びるリスク — Prisma のバルクインサート活用や件数上限のガイドを設計に含める。
- 本番相当環境での誤実行リスク — 環境変数や接続先判定に基づくガードロジックを設計に明記する。
- Player / Team スキーマ変更との不整合リスク — サンプルデータの構造と件数の変更を設計と要件に追記し、マイグレーション時に併せて更新する運用を推奨する。

## References
- Prisma Schema: prisma/schema.prisma
- Steering: .kiro/steering/product.md, tech.md, structure.md
