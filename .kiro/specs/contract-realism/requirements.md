# Requirements Document

## Project Description (Input)
契約のシミュレートにリアル感を持たせる

## Introduction
現在のFootballContractSimでは、選手とクラブの契約を作成できますが、契約条件や交渉プロセスが単純すぎてリアリティに欠けています。この機能強化により、現実のフットボール業界に近い契約交渉体験を実現します。選手の能力値・年齢・ポテンシャル・市場価値などの要素を反映した動的な契約条件提案、交渉の成功/失敗判定、契約期間や報酬額の妥当性検証などを導入し、より戦略的で没入感のある契約シミュレーションを提供します。

## Requirements

### Requirement 1: 市場価値ベース契約条件生成
**Objective:** As a ゲームプレイヤー, I want 選手の市場価値・能力値・年齢に基づいた適切な契約条件を自動算出できること, so that 現実的な契約交渉の出発点を得られる

#### Acceptance Criteria
1. When 契約作成フローで選手を選択した時, the Contract Service shall 選手の`marketValue`, `overall`, `potential`, `age`を基に推奨年俸額を算出する
2. When 推奨年俸を算出する時, the Contract Service shall 市場価値の5-15%を年間報酬の目安とする範囲を提示する
3. When 選手が25歳未満かつポテンシャル値が能力値より15以上高い時, the Contract Service shall 推奨契約期間を4-5年とする
4. When 選手が30歳以上の時, the Contract Service shall 推奨契約期間を1-2年とする
5. The Contract Service shall 算出された推奨条件を契約フォームのデフォルト値として表示する

### Requirement 2: 契約条件妥当性検証
**Objective:** As a ゲームプレイヤー, I want 入力した契約条件が現実的な範囲内かどうかリアルタイムに判定されること, so that 不適切な契約を防ぎ、リアルな制約の中で判断できる

#### Acceptance Criteria
1. When ユーザーが年俸額を入力した時, the Contract Service shall 市場価値の20%を超える場合は「過剰評価」警告を表示する
2. When ユーザーが年俸額を入力した時, the Contract Service shall 市場価値の3%未満の場合は「低評価」警告を表示する
3. When 選手が18歳未満の時, the Contract Service shall 契約期間が3年を超える場合は「長期契約リスク」警告を表示する
4. When 選手の能力値が70未満かつ年俸が週給20,000を超える時, the Contract Service shall 「能力値と報酬のミスマッチ」警告を表示する
5. While 契約条件に警告がある状態で, the Contract Service shall 契約作成ボタンに視覚的なインジケータを表示し、警告内容をツールチップで提供する

### Requirement 3: 契約交渉成否判定ロジック
**Objective:** As a ゲームプレイヤー, I want 提示した契約条件に対して選手/クラブが受諾するかシミュレートされること, so that 一方的な契約成立ではなく、交渉の成功/失敗を体験できる

#### Acceptance Criteria
1. When 契約作成を実行する時, the Contract Service shall 提示年俸と選手の期待年俸(市場価値の8%)を比較し成功確率を算出する
2. When 提示年俸が期待年俸の90%未満の時, the Contract Service shall 交渉成功率を30%以下に設定する
3. When 提示年俸が期待年俸の90-110%の範囲内の時, the Contract Service shall 交渉成功率を70-80%に設定する
4. When 提示年俸が期待年俸の110%以上の時, the Contract Service shall 交渉成功率を95%以上に設定する
5. When 交渉判定を実行する時, the Contract Service shall 算出された成功率に基づいてランダムに成功/失敗を決定する
6. If 交渉が失敗した時, then the Contract Service shall 契約を作成せず、選手視点の発言メッセージ（例: 「この条件では納得できないな...」）をActionLogに記録する
7. When 交渉が成功した時, the Contract Service shall 通常通り契約をDBに作成し、選手視点の発言メッセージ（例: 「良いオファーだ、サインしよう」）をActionLogに記録する

### Requirement 4: 契約提示履歴と学習ヒント
**Objective:** As a ゲームプレイヤー, I want 過去の契約交渉の成功/失敗パターンを確認できること, so that 次の交渉で適切な条件を学習できる

#### Acceptance Criteria
1. When 契約交渉が失敗した時, the Contract Service shall ActionLogに選手名・提示条件・選手の発言メッセージを構造化して記録する
2. When ActionHistoryコンポーネントで失敗ログを表示する時, the UI shall 選手の発言として間接的なヒント（例: 「もう少し評価してくれると嬉しいんだけどな」）を表示する
3. When ユーザーが契約フローを開始する時, the Dashboard Service shall 過去10件の契約交渉履歴（成功/失敗含む）をロードする
4. The Contract Service shall 同一選手に対する複数回の交渉試行を追跡可能にする（選手IDと試行回数の記録）
5. While 同一選手に3回以上交渉失敗している状態で, the UI shall 選手の発言として厳しい態度のメッセージ（例: 「何度も同じ話をするのは時間の無駄だと思うんだが」）を表示する

### Requirement 5: 市場価値と年俸の動的更新
**Objective:** As a システム, I want 契約締結後に選手の市場価値が契約内容を反映して更新されること, so that 契約がプレイヤーのステータスに影響を与えるリアルな経済モデルを実現する

#### Acceptance Criteria
1. When 契約が正式に締結された時, the Contract Service shall 選手の`marketValue`を年俸の10-15倍に更新する（市場価値 = 年俸 × 12）
2. When 選手の能力値が85以上かつ25歳未満の時, the Contract Service shall 市場価値の補正係数を1.2倍に設定する
3. When 選手の年齢が32歳以上の時, the Contract Service shall 市場価値の補正係数を0.7倍に設定する
4. When 契約締結により市場価値が更新された時, the Contract Service shall 更新前後の値をActionLogに記録する
5. The Contract Service shall 選手の`wage`フィールドを契約時の年俸で更新する

### Requirement 6: 契約UI拡張とフィードバック表示
**Objective:** As a ゲームプレイヤー, I want 契約フローのUI上で推奨条件・警告・交渉結果がわかりやすく表示されること, so that 複雑な契約ロジックを直感的に理解できる

#### Acceptance Criteria
1. When 選手を選択した時, the ContractFlow UI shall 推奨年俸範囲と推奨契約期間をインラインで表示する
2. When 年俸または契約期間を入力した時, the ContractFlow UI shall リアルタイムで妥当性検証を実行し、警告があれば即座に表示する
3. When 契約作成ボタンをクリックする前に, the ContractFlow UI shall 交渉成功予測確率（例: 「成功率: 75%」）を表示する
4. When 契約交渉が失敗した時, the ActionFeedback component shall 失敗アニメーションと選手の発言メッセージを3秒間表示する
5. When 契約交渉が成功した時, the ActionFeedback component shall 成功アニメーションと選手の発言メッセージを表示する
6. The ContractFlow UI shall 各入力フィールドに「？」ヘルプアイコンを配置し、ツールチップで計算ロジックを説明する

### Requirement 7: AI拡張可能な選手発言システム
**Objective:** As a システム開発者, I want 選手の発言生成をAIで拡張可能な設計にすること, so that 将来的にLLMによる動的な発言生成を統合できる

#### Acceptance Criteria
1. The Contract Service shall 選手発言生成を担当する独立したサービス層（PlayerDialogueService）を提供する
2. When 契約交渉結果を生成する時, the PlayerDialogueService shall 交渉コンテキスト（年俸差分・契約期間・選手属性）を構造化データとして受け取る
3. The PlayerDialogueService shall 初期実装としてルールベースのテンプレートマッチング方式で発言を生成する
4. The PlayerDialogueService shall 交渉状況タイプ（成功/失敗/年俸不足/期間不適切など）ごとに複数の発言パターンを持つ
5. When 選手の`age`, `overall`, `potential`属性が異なる時, the PlayerDialogueService shall 発言トーンを調整する（若手=素直、ベテラン=辛辣、スター選手=自信満々など）
6. The PlayerDialogueService shall 将来のAI統合のためのインターフェース（generateDialogue(context) → string）を定義する
7. Where AI統合が有効化された時, the PlayerDialogueService shall 外部LLM APIコール層に処理を委譲できる構造を持つ
8. The Contract Service shall 生成された選手発言をActionLogの`message`フィールドに格納し、UI層で直接表示できるようにする
