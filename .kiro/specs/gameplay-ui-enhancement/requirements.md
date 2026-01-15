# Requirements Document

## Introduction
本仕様は、FootballContractSim をよりゲーム感覚に近づけるためのシステムと UI の振る舞い要件を定義する。

## Requirements

### Requirement 1: ゲーム進行とフェーズ可視化
**Objective:** プレイヤーとして、契約や編成の進行状況を把握したい。そうすることで、意思決定の流れをゲームのように体験できる。

#### Acceptance Criteria
1.1 When 契約フローを開始する, the FootballContractSim System shall 現在のフェーズと残りステップ数を表示する
1.2 While フローが進行中である, the FootballContractSim System shall 進行状況を常に可視化する
1.3 When フェーズが完了する, the FootballContractSim System shall 進行状態を更新して次のフェーズを提示する
1.4 If 途中で画面を離脱して再訪した場合, the FootballContractSim System shall 直前の進行状態を復元する
1.5 The FootballContractSim System shall 進行状態の履歴を参照可能にする

### Requirement 2: 目標と達成状況の提示
**Objective:** プレイヤーとして、短期目標を確認したい。そうすることで、次の行動が明確になる。

#### Acceptance Criteria
2.1 When 主要画面を表示する, the FootballContractSim System shall 有効な目標一覧と達成状況を提示する
2.2 When 目標条件が満たされる, the FootballContractSim System shall 目標を達成として更新する
2.3 If 目標が無効化または期限切れである, the FootballContractSim System shall その理由を表示する
2.4 Where 目標管理機能が含まれる, the FootballContractSim System shall 達成済み目標の履歴を表示する
2.5 The FootballContractSim System shall 目標の達成・未達成を一目で識別できる表現を提供する

### Requirement 3: 行動結果のフィードバック
**Objective:** プレイヤーとして、行動の結果を即座に理解したい。そうすることで、選択の手応えを得られる。

#### Acceptance Criteria
3.1 When 主要アクションが実行される, the FootballContractSim System shall 結果の概要を即時に提示する
3.2 While アクション処理中である, the FootballContractSim System shall 処理中であることを明示する
3.3 If アクションが失敗する, the FootballContractSim System shall 失敗理由と次の行動のヒントを表示する
3.4 When アクション結果がリソースや指標を変更する, the FootballContractSim System shall 変更点を強調して提示する
3.5 The FootballContractSim System shall 直近のアクション履歴を確認できるようにする

### Requirement 4: 評価指標とスコアの提示
**Objective:** プレイヤーとして、契約判断の質を評価したい。そうすることで、ゲームとしての戦略性が高まる。

#### Acceptance Criteria
4.1 When 契約案が作成または更新される, the FootballContractSim System shall 評価指標を計算して提示する
4.2 When 複数の契約案を比較する, the FootballContractSim System shall 指標の差分を提示する
4.3 If 評価に必要な情報が不足している, the FootballContractSim System shall 不足項目を明示する
4.4 Where スコア機能が含まれる, the FootballContractSim System shall 総合スコアを提示する
4.5 The FootballContractSim System shall 評価指標の意味を確認できる説明を提供する

### Requirement 5: ゲーム的ダッシュボード体験
**Objective:** プレイヤーとして、クラブ状況の全体像をひと目で把握したい。そうすることで、次の一手を判断しやすくなる。

#### Acceptance Criteria
5.1 When ホーム画面を表示する, the FootballContractSim System shall 主要リソースと最新状況のサマリを提示する
5.2 When サマリ項目が選択される, the FootballContractSim System shall 関連する詳細画面へ誘導する
5.3 If 表示するデータが存在しない, the FootballContractSim System shall 適切な空状態ガイダンスを提示する
5.4 While 状態が変化している, the FootballContractSim System shall サマリを最新状態に更新する
5.5 The FootballContractSim System shall 主要な次のアクションへの導線を提供する

