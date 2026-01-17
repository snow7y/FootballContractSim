# Implementation Gap Analysis

## 分析サマリ

**スコープ**: 契約シミュレーションのリアリティ向上のため、選手の市場価値・能力値に基づく契約条件生成、交渉成否判定、選手視点の発言システム、AI拡張可能な設計を追加する。

**主要な課題**:
- 契約条件算出ロジックの新規実装（選手属性→推奨年俸・期間の算出）
- 交渉成否判定の確率的シミュレーション機能追加
- 選手発言生成システムの設計と統合（ルールベース初期実装+AI拡張対応）
- ActionLog・UIコンポーネントの発言メッセージ対応への拡張

**推奨アプローチ**: Hybrid（新規サービス作成 + 既存コンポーネント拡張）
- 新規: `contract-recommendation-service.ts`, `player-dialogue-service.ts`
- 拡張: `contract-actions.ts`, `ContractFlow.tsx`, `ActionFeedback.tsx`, `ActionHistory.tsx`

---

## 1. Current State Investigation

### 1.1 Domain Assets & Directory Layout

**契約関連の既存アセット**:
```
src/app/contracts/
├── contract-actions.ts          # 契約作成・取得のサーバアクション
├── gameplay-state-service.ts    # ダッシュボード・Phase・Goal・ActionLog・Score管理
├── user-actions.ts              # ユーザー選択/作成
├── ContractFlow.tsx             # 契約作成UI（フォーム・プレビュー・確認）
├── ActionFeedback.tsx           # 最新アクション結果の表示
├── ActionHistory.tsx            # アクション履歴一覧
└── [その他UIコンポーネント]
```

**データモデル（Prisma Schema）**:
- `Player`: `marketValue`, `wage`, `overall`, `potential`, `age` などの属性を保持
- `Contract`: `wage`, `startDate`, `endDate` を保持（市場価値との連動なし）
- `ActionLog`: `actionType`, `status`, `message`, `hint`, `deltaHighlights` を保持
- `ActionType` enum: `ContractCreated`, `ContractFailed`, `UserSelected`, `UserCreated`, `PhaseUpdated`

### 1.2 Conventions & Patterns

**アーキテクチャパターン**:
- Next.js App Router + Server Actions（`'use server'`）
- クライアントコンポーネント（`'use client'`）でUI・状態管理
- Prisma ORMでデータアクセス（`@/lib/prisma`）
- 型安全な結果型パターン: `{ ok: true, data: T } | { ok: false, error: E }`

**命名規則**:
- サーバアクション: `createContract`, `recordAction`, `refreshScore` など動詞+名詞
- サービスファイル: `contract-actions.ts`, `gameplay-state-service.ts` のkebab-case
- UIコンポーネント: `ContractFlow.tsx`, `ActionFeedback.tsx` のPascalCase

**依存方向**:
- UI → Server Actions → Prisma
- `contract-actions.ts` → `gameplay-state-service.ts` の依存（recordAction, refreshScore呼び出し）
- ActionLogは汎用的なメッセージ記録基盤として機能

### 1.3 Integration Surfaces

**ActionLog統合**:
- 現在: `message`（文字列）、`hint`（文字列・optional）、`deltaHighlights`（文字列配列・optional）
- UI表示: `ActionFeedback.tsx`, `ActionHistory.tsx` で `message` と `hint` を表示
- **拡張ポイント**: `message`フィールドに選手の発言を格納、`hint`は削除または非推奨化

**ContractFlow UI統合**:
- 選手・クラブ選択時に `selectedPlayer` を保持（`{ id, name, meta? }`）
- **拡張ポイント**: Player詳細（overall, potential, age, marketValue）をロードし、推奨条件を算出・表示
- **リアルタイム検証**: 現在は基本的なバリデーション（正の数値、期間の整合性）のみ

**Prisma Schema統合**:
- Player.marketValue, Player.wage は既存フィールド（更新可能）
- Contract.wage は契約時に記録（Player.wageとは独立）
- **拡張ポイント**: 契約締結時にPlayer.marketValueとPlayer.wageを更新する処理追加

---

## 2. Requirements Feasibility Analysis

### 2.1 Technical Needs from Requirements

| Requirement | Technical Needs | Current Gap |
|------------|----------------|-------------|
| **Req 1**: 市場価値ベース契約条件生成 | - 選手属性（marketValue, overall, potential, age）を基にした算出ロジック<br>- 推奨年俸範囲（市場価値の5-15%）<br>- 推奨契約期間（年齢・ポテンシャル依存） | **Missing**: 算出ロジック、UI表示機能 |
| **Req 2**: 契約条件妥当性検証 | - リアルタイム検証ロジック（過剰評価/低評価/ミスマッチ警告）<br>- UI警告表示（インジケータ・ツールチップ） | **Missing**: 妥当性判定ロジック、警告UI |
| **Req 3**: 契約交渉成否判定 | - 成功率算出ロジック（年俸差分ベース）<br>- ランダム判定（確率的成功/失敗）<br>- 失敗時の契約作成抑止<br>- 選手視点の発言メッセージ生成 | **Missing**: 判定ロジック全体、発言生成 |
| **Req 4**: 契約提示履歴と学習ヒント | - 失敗時の構造化データ記録（ActionLog）<br>- 選手ID別の試行回数追跡<br>- 間接的ヒント表示（選手の発言） | **Partial**: ActionLog基盤あり、発言生成・試行追跡なし |
| **Req 5**: 市場価値と年俸の動的更新 | - 契約締結時のPlayer.marketValue更新ロジック<br>- 年齢・能力値による補正係数<br>- ActionLogへの更新記録 | **Missing**: 更新ロジック全体 |
| **Req 6**: 契約UI拡張とフィードバック | - 推奨条件のインライン表示<br>- リアルタイム妥当性検証<br>- 交渉成功率予測表示<br>- アニメーション付きフィードバック<br>- ヘルプアイコン・ツールチップ | **Missing**: 新規UI要素全体 |
| **Req 7**: AI拡張可能な選手発言システム | - PlayerDialogueService（独立サービス）<br>- ルールベーステンプレート初期実装<br>- 交渉コンテキスト（年俸差分・選手属性）の構造化<br>- AI統合インターフェース（generateDialogue） | **Missing**: サービス全体 |

### 2.2 Complexity Signals

- **Algorithmic Logic**: 契約条件算出、成功率計算、市場価値更新（中程度）
- **Workflow**: 契約作成フロー拡張（交渉判定→失敗時抑止/成功時継続）（中程度）
- **UI/UX**: リアルタイム検証、推奨条件表示、警告インジケータ、アニメーション（複雑）
- **Architecture**: PlayerDialogueService新規導入、AI拡張対応インターフェース設計（高）

### 2.3 Unknowns & Research Needs

1. **Research Needed**: AI統合のための外部LLM API選定とインテグレーション方式（OpenAI API、Anthropic Claude、ローカルLLMなど）
2. **Research Needed**: アニメーション実装方式（Tailwind CSS transitions、Framer Motion、CSS Keyframes）
3. **Constraint**: ActionType enumの拡張可否（`ContractNegotiationStarted`, `ContractNegotiationFailed` などの追加が必要か、既存`ContractCreated`/`ContractFailed`で十分か）
4. **Research Needed**: 試行回数追跡の永続化戦略（ActionLog解析 vs 新規テーブル`NegotiationAttempt`）

---

## 3. Implementation Approach Options

### Option A: Extend Existing Components

**対象ファイル**:
- `contract-actions.ts`: 契約条件算出、妥当性検証、交渉判定、市場価値更新を追加
- `ContractFlow.tsx`: 推奨条件表示、警告表示、成功率予測UIを追加
- `ActionFeedback.tsx`, `ActionHistory.tsx`: 選手発言の表示対応

**Rationale**:
- 既存の契約作成フローに自然に統合できる
- ファイル数を増やさず、開発初期は高速に進められる

**Trade-offs**:
- ✅ 最小限のファイル変更、既存パターン踏襲
- ✅ インテグレーションテストの対象が局所的
- ❌ `contract-actions.ts`が肥大化（現在181行→推定400行以上）
- ❌ 単一責任原則違反のリスク（契約CRUD + 条件算出 + 交渉判定 + 発言生成）
- ❌ AI統合時の影響範囲が広い

**Complexity & Maintainability**:
- 認知負荷: 高（1ファイルに多数の責務）
- テスト容易性: 中（モック複雑化）
- 将来拡張: 低（リファクタリング必須）

---

### Option B: Create New Components

**新規ファイル**:
- `src/app/contracts/contract-recommendation-service.ts`: 契約条件算出、妥当性検証ロジック
- `src/app/contracts/player-dialogue-service.ts`: 選手発言生成（ルールベース+AI統合インターフェース）
- `src/app/contracts/negotiation-service.ts`: 交渉成否判定、試行追跡ロジック

**Integration Points**:
- `contract-actions.ts` → 各新規サービスを呼び出し
- `ContractFlow.tsx` → `contract-recommendation-service.ts`から推奨条件を取得
- `ActionFeedback/ActionHistory` → `player-dialogue-service.ts`が生成した発言を表示

**Responsibility Boundaries**:
- **contract-recommendation-service**: 選手属性→推奨条件算出、妥当性検証
- **player-dialogue-service**: 交渉コンテキスト→発言生成（ルールベース/AI）
- **negotiation-service**: 成功率算出、ランダム判定、試行追跡
- **contract-actions**: 契約CRUD、各サービスのオーケストレーション

**Trade-offs**:
- ✅ 明確な責務分離、単体テスト容易
- ✅ AI統合時の影響範囲が`player-dialogue-service.ts`に限定
- ✅ 将来の拡張性高（例: 交渉AI、複雑な市場価値モデル）
- ❌ ファイル数増加（3ファイル+既存4ファイル拡張=7ファイル関与）
- ❌ 初期開発でのインターフェース設計コスト

**Complexity & Maintainability**:
- 認知負荷: 低（各サービスが独立）
- テスト容易性: 高（サービス単位でモック）
- 将来拡張: 高（サービス交換・拡張が容易）

---

### Option C: Hybrid Approach

**Combination Strategy**:
1. **Phase 1（初期実装）**: 新規サービス作成 + 既存コンポーネント最小限拡張
   - 新規: `contract-recommendation-service.ts`, `player-dialogue-service.ts`
   - 拡張: `contract-actions.ts`（交渉判定統合）、`ContractFlow.tsx`（UI拡張）
   - 見送り: `negotiation-service.ts`（試行追跡はActionLog解析で代替）

2. **Phase 2（AI統合準備）**: `player-dialogue-service.ts`にAI統合層追加
   - ルールベース実装を保持しつつ、AI切り替え可能な設計

3. **Phase 3（高度化）**: 必要に応じて`negotiation-service.ts`を分離、試行追跡テーブル追加

**Risk Mitigation**:
- Feature flag不要（初期はルールベースのみ、AI統合はオプション機能）
- ActionLog既存構造を活用し、破壊的変更を回避
- UI拡張は段階的（Phase 1: 推奨条件・警告、Phase 2: アニメーション）

**Trade-offs**:
- ✅ 最適なバランス（責務分離 + 段階的実装）
- ✅ AI統合の影響範囲を限定
- ✅ 既存テストへの影響最小化
- ❌ Phase境界の設計判断が必要
- ❌ Phase 1で全要件カバーしない（段階的デリバリー前提）

**Complexity & Maintainability**:
- 認知負荷: 中（Phase 1は管理可能、Phase 2以降で分離強化）
- テスト容易性: 高（サービス層は独立テスト可能）
- 将来拡張: 高（Phase設計により拡張容易）

---

## 4. Implementation Complexity & Risk

### Effort Estimation

- **S (1-3 days)**: Requirement 1（推奨条件算出・表示）のみ
- **M (3-7 days)**: Requirements 1, 2, 6（推奨条件+妥当性検証+基本UI拡張）
- **L (1-2 weeks)**: Requirements 1-6（交渉判定・選手発言・市場価値更新含む）
- **XL (2+ weeks)**: Requirements 1-7（AI統合インターフェース設計+実装）

**推奨スコープ（Phase 1）**: **L** - Requirements 1-6のルールベース実装
**Phase 2スコープ**: **M** - Requirement 7のAI統合

### Risk Assessment

| Risk Area | Level | Justification |
|-----------|-------|--------------|
| **技術的複雑性** | Medium | 確率的判定・ルールベース発言は既知技術、AI統合は後回し |
| **統合リスク** | Medium | 既存ActionLog・UIコンポーネント拡張は明確、破壊的変更なし |
| **パフォーマンス** | Low | 算出ロジックは軽量（選手1件のデータ処理）、DB負荷増なし |
| **テスト容易性** | Medium | サービス層は単体テスト容易、UI統合テストは既存パターン踏襲 |
| **AI統合の不確実性** | High | 外部API選定・レイテンシ・コスト管理が未解決（Phase 2で対応） |

---

## 5. Recommendations for Design Phase

### Preferred Approach

**Hybrid Approach (Option C) - Phase 1 Focus**

**Rationale**:
- 責務分離のメリット（Option B）を享受しつつ、段階的実装（Option C）でリスク管理
- AI統合を後回しにすることで、Phase 1の複雑性を抑制
- 既存コードへの影響を最小化し、既存テストの保守性を維持

### Key Design Decisions

1. **サービス層設計**:
   - `contract-recommendation-service.ts`: 推奨条件算出と妥当性検証を提供
     - Export: `calculateRecommendation(player: Player)`, `validateContractTerms(player: Player, input: ContractInput)`
   - `player-dialogue-service.ts`: 選手発言生成を提供
     - Export: `generateDialogue(context: NegotiationContext) => string`
     - Interface設計でAI統合を見据える（Phase 2で`AIDialogueProvider`追加）

2. **ActionLog拡張戦略**:
   - `hint`フィールドは廃止せず非推奨化（既存データ互換性）
   - `message`に選手発言を格納（UI表示はそのまま）
   - `ActionType` enumは既存の`ContractCreated`/`ContractFailed`を継続利用

3. **UI拡張優先順位**:
   - Phase 1: 推奨条件表示、警告インジケータ、成功率予測
   - Phase 2: アニメーション、ヘルプツールチップ

4. **試行追跡戦略**:
   - Phase 1: ActionLog解析（`actionType: 'ContractFailed'` + `playerId`フィルタ）
   - Phase 2（必要に応じて）: 専用テーブル`NegotiationAttempt`導入

### Research Items to Carry Forward

1. **AI統合方式の技術選定** (Phase 2):
   - OpenAI API vs Anthropic Claude vs ローカルLLM（Ollama）
   - レイテンシ・コスト・プライバシー要件のトレードオフ分析
   - Vercel AI SDK統合の検討

2. **アニメーション実装方式** (Phase 2):
   - Tailwind CSS transitions（軽量）vs Framer Motion（高度）
   - 成功/失敗時のフィードバックUX設計

3. **試行追跡の永続化戦略** (Phase 2):
   - ActionLog解析で十分か、専用テーブルが必要か
   - 試行回数に基づく動的難易度調整の実装可否

---

## Requirement-to-Asset Map

| Requirement | Related Assets | Gap Status |
|------------|---------------|-----------|
| Req 1: 市場価値ベース契約条件生成 | Player model, ContractFlow.tsx | **Missing**: 算出ロジック、UI表示 |
| Req 2: 契約条件妥当性検証 | ContractFlow validation | **Missing**: 妥当性判定、警告UI |
| Req 3: 契約交渉成否判定 | contract-actions.ts, ActionLog | **Missing**: 判定ロジック、発言生成 |
| Req 4: 契約提示履歴と学習ヒント | ActionLog, ActionHistory.tsx | **Partial**: 基盤あり、発言・追跡なし |
| Req 5: 市場価値と年俸の動的更新 | Player model, contract-actions.ts | **Missing**: 更新ロジック |
| Req 6: 契約UI拡張とフィードバック | ContractFlow.tsx, ActionFeedback.tsx | **Missing**: 新規UI要素 |
| Req 7: AI拡張可能な選手発言システム | - | **Missing**: サービス全体 |

---

## 結論

Hybrid Approach（Option C）により、Phase 1で Requirements 1-6 をルールベース実装し、Phase 2で Requirement 7 のAI統合を追加することを推奨します。この戦略により、初期開発の複雑性を抑えつつ、将来の拡張性を確保できます。

次のステップとして、設計フェーズで以下を明確化してください：
- 各サービスの詳細インターフェース設計
- UI拡張のワイヤーフレーム・コンポーネント分割
- AI統合インターフェースの仕様（Phase 2見据え）
