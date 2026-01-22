# Requirements Document

## Introduction
本機能は、FootballContractSim における「選手との契約交渉」を会話形式（チャット）で進められる体験として提供する。LLM を利用できない環境でもゲームが成立することを前提に、LLM 利用はオプションとして切り替え可能にする。LLM 利用時は LangChain を用いてエージェント的に振る舞い、選手に関する情報（能力・市場価値・契約状況など）を踏まえた、よりリアルな交渉を実現する。

## Requirements

### Requirement 1: 契約交渉チャットUI
**Objective:** As a クラブ運営者, I want 選手との契約交渉をチャット画面で行いたい, so that 交渉の臨場感を得られる

#### Acceptance Criteria
1.1 When ユーザーが選手の契約交渉を開始する, the Contract Negotiation UI shall チャット画面を表示する
1.2 When ユーザーがメッセージを送信する, the Contract Negotiation UI shall 送信内容を会話履歴に追加して表示する
1.3 When 選手側の応答が生成される, the Contract Negotiation UI shall 応答を会話履歴に追加して表示する
1.4 While 契約交渉が進行中である, the Contract Negotiation UI shall 現在の交渉ステータス（例: 提案中/返答待ち/合意/決裂）を表示する
1.5 If 入力が空、または不正な形式で送信が試みられる, the Contract Negotiation UI shall 送信を行わずエラーメッセージを表示する

### Requirement 2: 契約交渉ワークフロー（提案・カウンター・合意/決裂）
**Objective:** As a クラブ運営者, I want 条件提示とカウンターを繰り返して合意または決裂で交渉を終えたい, so that 交渉の結果をゲーム進行に反映できる

#### Acceptance Criteria
2.1 When ユーザーが契約条件を提示する, the Contract Negotiation Service shall その提示を交渉イベントとして記録する
2.2 When 選手側がカウンター条件を提示する, the Contract Negotiation Service shall その提示を交渉イベントとして記録する
2.3 When 双方が合意条件に到達する, the Contract Negotiation Service shall 交渉ステータスを合意として確定する
2.4 When 交渉が決裂する, the Contract Negotiation Service shall 交渉ステータスを決裂として確定する
2.5 If 交渉が確定（合意または決裂）した後に追加メッセージ送信が試みられる, the Contract Negotiation Service shall 送信を拒否し理由を返す

### Requirement 3: LLM利用のオプション化（切り替え・フォールバック）
**Objective:** As a ユーザー, I want LLMを使う/使わないを切り替えたい, so that 実行環境の制約に合わせて遊べる

#### Acceptance Criteria
3.1 The Application shall LLM機能を有効/無効に切り替える設定を提供する
3.2 Where LLM機能が無効である, the Contract Negotiation Service shall ルールベース（非LLM）で選手側の応答を生成できる
3.3 Where LLM機能が有効である, the Contract Negotiation Service shall LLMを用いて選手側の応答を生成できる
3.4 If LLM機能が有効であるがLLM実行に失敗する（例: 設定不備/タイムアウト/外部依存の障害）, the Contract Negotiation Service shall 非LLMのフォールバック応答を返し、継続可能な状態を保つ
3.5 When ユーザーがLLM機能の設定を変更する, the Application shall 以後の交渉セッションに設定を反映する

### Requirement 4: LangChainエージェントによる交渉応答
**Objective:** As a クラブ運営者, I want 選手がエージェントのように状況を理解して返答してほしい, so that 現実味のある交渉ができる

#### Acceptance Criteria
4.1 Where LLM機能が有効である, the LLM Negotiation Agent shall LangChain を用いて会話生成をオーケストレーションする
4.2 When ユーザーのメッセージが送信される, the LLM Negotiation Agent shall 選手の役割（例: 選手本人/代理人）として一貫した口調・方針で返答を生成する
4.3 When 交渉の履歴が存在する, the LLM Negotiation Agent shall 会話履歴を踏まえて返答を生成する
4.4 If 返答生成に必要な情報が不足している, the LLM Negotiation Agent shall 交渉の前提に関する確認質問を返す
4.5 The LLM Negotiation Agent shall 交渉結果（合意/決裂）に影響する根拠を、ユーザーが理解できる形で返答に含められる

### Requirement 5: 選手情報コンテキストの提供
**Objective:** As a クラブ運営者, I want 交渉相手の選手情報が会話に反映されてほしい, so that 納得感のある条件提示と応答になる

#### Acceptance Criteria
5.1 When 契約交渉が開始される, the Player Context Provider shall 対象選手の基本情報（例: 年齢/ポジション/能力）を取得できる
5.2 When 契約交渉が開始される, the Player Context Provider shall 対象選手の契約関連情報（例: 契約期間/年俸/条項）を取得できる
5.3 When 交渉応答が生成される, the Contract Negotiation Service shall 取得した選手情報を応答生成のコンテキストとして利用できる
5.4 If 選手情報の取得に失敗する, the Contract Negotiation Service shall 最小限の情報で交渉を継続できる応答を生成し、エラーを通知する
5.5 The Application shall ユーザーが交渉の前提として参照できるよう、交渉中に選手情報の要約を表示できる

### Requirement 6: 互換性・運用上の要件（最新LangChain追従のための情報取得）
**Objective:** As a 開発者, I want LangChainの最新バージョンに追従しやすい状態にしたい, so that LLM機能を長期的に保守できる

#### Acceptance Criteria
6.1 The Application shall LangChain のバージョン情報をリポジトリ上で明確に確認できる
6.2 When LangChain のAPI更新が必要になる, the Development Workflow shall Docs by LangChain MCP を用いて最新仕様を参照できる
6.3 If LangChain のアップデートにより互換性問題が発生する, the Development Workflow shall 影響範囲を特定できる情報（例: 変更点の記録）を残せる

### Requirement 7: 監査性・安全性（LLM利用時）
**Objective:** As a 運営者, I want LLM利用時でも不適切な出力や破綻が起きにくいようにしたい, so that 安定してゲーム体験を提供できる

#### Acceptance Criteria
7.1 Where LLM機能が有効である, the Application shall 交渉セッションごとに入出力の要約ログを追跡できる
7.2 If LLMが不適切または無関係な内容を返す, the Contract Negotiation Service shall 交渉を継続可能な安全なメッセージに置き換えられる
7.3 While 交渉応答を生成している, the Contract Negotiation UI shall ユーザーに処理中状態を表示する

