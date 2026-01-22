
# Research & Design Decisions

## Summary
- **Feature**: llm-player-contract-chat
- **Discovery Scope**: Complex Integration
- **Key Findings**:
	- 既存の契約フローは「フォーム→成功/失敗→単発の選手台詞（ActionLog）」であり、往復会話・交渉セッション・履歴永続化の概念が不足している。
	- 監査/履歴は ActionLog だけでは不足（直近10件、ActionType enum拡張の負荷）なので、交渉専用の永続モデルを新設するのが安全。
	- LangChain は v1 で `createAgent` を中心に整理され、プロバイダは `@langchain/*` の個別パッケージに分割されているため、Next.js側では「最小依存 + サーバ側実行 + フォールバック」を基本に置くのが保守的。

## Research Log

### 既存実装の契約フローは“単発台詞”まで
- **Context**: 要件 1.x / 2.x のチャット交渉を追加するにあたり、現状の交渉関連資産と制約を把握する必要があった。
- **Sources Consulted**:
	- 既存コード: `src/app/contracts/*`
	- DBスキーマ: `prisma/schema.prisma`
- **Findings**:
	- UIは `ContractFlow.tsx` のフォーム中心で、チャットUIは存在しない。
	- `contract-actions.ts` は成功率を計算して成功/失敗を確定し、`player-dialogue-service.ts` で単発の台詞を生成して ActionLog に記録する。
	- ActionLog は“ダッシュボード用の最近の出来事”という役割で、長い会話履歴（ページング/検索/整合性）には向かない。
- **Implications**:
	- 会話型の交渉（セッション/ターン/状態遷移）は、新規のドメインサービスとデータモデルで切り出す必要がある。
	- ActionLog は「合意/決裂などの要約イベント」を残す用途に寄せ、会話履歴は別系統で扱うのが自然。

### 会話履歴の永続化戦略（ActionLog流用 vs 新規モデル）
- **Context**: 要件 1.x/2.x/7.1 により、セッション単位の履歴と監査が必要。
- **Sources Consulted**:
	- 現行の ActionLog 実装/制約（enum/取得件数）
- **Findings**:
	- ActionLogを会話用途に拡張すると、(1) Prisma enum増分と(2) TS側union更新が必須で運用負荷が高い。
	- 直近10件表示の前提があり、会話履歴UIとしての要件（スクロール、過去ログ参照）と衝突しやすい。
- **Implications**:
	- `NegotiationSession` / `NegotiationMessage` 相当の新規モデルを導入し、ActionLogは要約/監査の“入口”として維持する方針が妥当。

### LangChain v1の方向性（JS/TS）
- **Context**: 要件 4.1 で LangChain を使った“エージェントっぽい”交渉応答を実装するため、最新の推奨構成を確認したい。
- **Sources Consulted**:
	- What’s new in LangChain v1: https://docs.langchain.com/oss/javascript/releases/langchain-v1
	- createAgent の例（JS）: https://docs.langchain.com/oss/javascript/langchain/multi-agent/handoffs-customer-support
	- Runtime 概要（JS）: https://docs.langchain.com/oss/javascript/langchain/runtime
	- OpenAI tools 統合（JS）: https://docs.langchain.com/oss/javascript/integrations/tools/openai
- **Findings**:
	- LangChain v1 は `createAgent` を標準入口として整理され、エージェントは LangGraph のランタイム上で動作する。
	- JS/TSではプロバイダ統合が `@langchain/openai` 等に分割され、モデル/ツールの依存を絞りやすい。
	- `createAgent` は tools + state schema + checkpointer（例: `MemorySaver`）と組み合わせられる。
- **Implications**:
	- Next.js（Server Actions/Route Handlers）側では、交渉1ターンをサーバ処理として完結させ、必要な状態（履歴）をDBから読み出してプロンプトへ注入するのが扱いやすい。
	- 将来的に tool calling を入れる場合でも、まずは「選手情報はサーバで取得→プロンプトへ渡す」の1ツール相当から始めると安全。

### 安全性/監査（LLM失敗や不適切出力）
- **Context**: 要件 3.4 / 7.1 / 7.2 でフォールバックと安全な置換が必要。
- **Sources Consulted**:
	- @langchain/openai changelog（moderation/option言及を含む）: https://docs.langchain.com/oss/javascript/releases/changelog
- **Findings**:
	- LLM呼び出しは失敗が前提（設定不備/タイムアウト/プロバイダ障害）。
	- モデル側/クライアント側の安全策（不適切出力検知や、出力の置換）をアプリ側で持つ必要がある。
- **Implications**:
	- LLMを“必須”にせず、常にルールベース生成へフォールバックできる二系統構成が設計上必須。
	- 監査ログは「全文保存」ではなく「要約＋メタデータ（失敗理由/タイムアウト等）」を基本にする（PIIや保存コストの観点）。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存 `ContractFlow` へ直足し | フォームUIを拡張してチャットUIを同居 | 導線が少ない、既存UIパターン流用 | コンポーネント肥大化、既存テスト影響 | 初期PoC向きだが長期保守が不利 |
| B: チャットを別画面に新設 | 新規ページ/コンポーネントで交渉 | 既存を壊しにくい、責務分離 | 導線/遷移設計が必要 | 段階導入に向く |
| C: Hybrid（推奨） | 交渉セッション/履歴/LLMを分離し既存から呼ぶ | 影響範囲限定、拡張しやすい | 初期設計コスト | 要件 3.x/7.x を満たしやすい |

## Design Decisions

### Decision: 交渉は新規“セッション”ドメインとして実装する
- **Context**: 1.x/2.x は往復会話と状態遷移を要求し、現状は単発判定のみ。
- **Alternatives Considered**:
	1. ActionLog を会話履歴として拡張
	2. 交渉専用モデル（Session/Message）を新設
- **Selected Approach**: 交渉専用モデルを新設し、ActionLogは要約イベントとして残す。
- **Rationale**: ActionLogの件数/enum拡張コストと会話UI要件が衝突しやすいため。
- **Trade-offs**: DBスキーマが増えるが、責務分離と将来拡張（ページング、検索、監査）を得る。
- **Follow-up**: 既存のテスト（ActionLog周り）への影響を最小化するマイグレーション計画を設計で確定する。

### Decision: LLMはサーバ側で“任意”実行し、常にフォールバック可能にする
- **Context**: 3.x/7.x により、LLMが使えない環境・失敗時の継続が必須。
- **Alternatives Considered**:
	1. UI側でLLM実行（ブラウザ）
	2. サーバ側でLLM実行（Server Actions/Route Handlers）
- **Selected Approach**: サーバ側でLLMを実行し、失敗時はルールベースにフォールバックする。
- **Rationale**: APIキー管理/タイムアウト/リトライ/ログが一箇所に集約でき、環境差分にも強い。
- **Trade-offs**: サーバ負荷とレイテンシが増えるため、処理中表示やタイムアウト設計が必要。
- **Follow-up**: サーバ実行時の最大実行時間（Next.js/ホスティング）に合わせたタイムアウト/メッセージの設計を行う。

### Decision: LangChainは v1 の `createAgent` を軸に最小依存で導入する
- **Context**: 4.1 でLangChainを前提としつつ、最新追従（6.x）と実装コストを両立したい。
- **Alternatives Considered**:
	1. LangChainなしで独自プロンプト実装
	2. LangChain v1（`langchain` + `@langchain/openai`）で導入
	3. 最初から LangGraph を主導入（高度なオーケストレーション）
- **Selected Approach**: LangChain v1 の `createAgent` を入口にし、必要なプロバイダ統合だけ追加する。
- **Rationale**: ドキュメント上の推奨が `createAgent` に寄っており、将来のtool calling/状態管理にも拡張可能。
- **Trade-offs**: 学習/デバッグコストは増えるため、まずは「会話生成のみ」の薄い構成から段階的に拡張する。
- **Follow-up**: 実装時に依存バージョンと最小サンプル（1ターン生成）を固定し、テストで回帰検知できるようにする。

## Risks & Mitigations
- LangChain/プロバイダAPIの更新で破壊的変更が入る — `package.json` でバージョン固定 + 6.2/6.3 に沿ってDocs MCPで追跡し、差分を `research.md` に追記。
- LLM実行の不安定さ（タイムアウト/障害/コスト） — 短いタイムアウト、リトライ上限、必ずルールベースフォールバック（3.4）。
- 監査ログの肥大化/PII混入 — “要約＋メタデータ”を基本にして、必要時のみ詳細保存（7.1）。

## References
- [What’s new in LangChain v1](https://docs.langchain.com/oss/javascript/releases/langchain-v1) — v1の設計方針と入口（createAgent）
- [Create the agent (JS example)](https://docs.langchain.com/oss/javascript/langchain/multi-agent/handoffs-customer-support) — `createAgent` と `MemorySaver` 例
- [Runtime (JS)](https://docs.langchain.com/oss/javascript/langchain/runtime) — エージェントの runtime/context 概念
- [OpenAI tools integration (JS)](https://docs.langchain.com/oss/javascript/integrations/tools/openai) — `bindTools()` / `createAgent` によるツール統合
