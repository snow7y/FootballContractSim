'use client';

import { useEffect, useMemo, useState, useTransition, type ChangeEvent } from 'react';
import Link from 'next/link';
import { createContract, getContractRecommendation, getNegotiationPreview, validateContractTermsAction } from './contract-actions';
import ActionFeedback from './ActionFeedback';
import ActionHistory from './ActionHistory';
import GoalPanel from './GoalPanel';
import PanelGrid from './PanelGrid';
import PhaseProgress from './PhaseProgress';
import ScorePanel from './ScorePanel';
import type { GameplayDashboardData } from './gameplay-state-service';
import type { ContractWarning } from './contract-recommendation-service';

export type ContractOption = {
  id: number;
  name: string;
  meta?: string | null;
};

type ContractFlowProps = {
  players: ContractOption[];
  teams: ContractOption[];
  dashboardData: GameplayDashboardData | null;
  onRefreshDashboard: () => Promise<void>;
  currentUser: { id: number; name: string } | null;
};

type DraftState = {
  playerId: string;
  teamId: string;
  startDate: string;
  endDate: string;
  wage: string;
};

const initialDraft: DraftState = {
  playerId: '',
  teamId: '',
  startDate: '',
  endDate: '',
  wage: '',
};

export default function ContractFlow({ players, teams, dashboardData, onRefreshDashboard, currentUser }: ContractFlowProps) {
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [contractId, setContractId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recommendation, setRecommendation] = useState<{
    wageRange: { min: number; max: number };
    contractYears: { min: number; max: number };
    rationale: string;
  } | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [warnings, setWarnings] = useState<ContractWarning[]>([]);
  const [warningLoading, setWarningLoading] = useState(false);
  const [successPreview, setSuccessPreview] = useState<{ successRate: number; expectedWage: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const latestAction = dashboardData?.recentActions?.[0] ?? null;

  const canStart = players.length > 0 && teams.length > 0;

  const selectedPlayer = useMemo(
    () => players.find((player) => String(player.id) === draft.playerId) ?? null,
    [players, draft.playerId]
  );
  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.id) === draft.teamId) ?? null,
    [teams, draft.teamId]
  );

  const contractYears = useMemo(() => {
    if (!draft.startDate || !draft.endDate) return 0;
    const start = new Date(draft.startDate);
    const end = new Date(draft.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(Number((months / 12).toFixed(1)), 0);
  }, [draft.endDate, draft.startDate]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!draft.playerId) errors.push('選手を選択してください');
    if (!draft.teamId) errors.push('クラブを選択してください');
    if (!draft.startDate) errors.push('開始日を入力してください');
    if (!draft.endDate) errors.push('終了日を入力してください');
    if (!draft.wage || Number(draft.wage) <= 0) errors.push('報酬は正の数値を入力してください');
    if (draft.startDate && draft.endDate && new Date(draft.startDate) >= new Date(draft.endDate)) {
      errors.push('契約期間は開始日より終了日を後にしてください');
    }
    return errors;
  }, [draft]);

  const isSubmitDisabled = validationErrors.length > 0 || isPending;

  const handleDraftChange =
    (field: keyof DraftState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));
    setResultMessage(null);
    setContractId(null);
  };

  useEffect(() => {
    let cancelled = false;
    const playerId = Number(draft.playerId);
    if (!playerId) {
      setRecommendation(null);
      return undefined;
    }
    setRecommendationLoading(true);
    getContractRecommendation(playerId)
      .then((response) => {
        if (cancelled) return;
        if (response.ok) {
          setRecommendation(response.recommendation);
        } else {
          setRecommendation(null);
        }
      })
      .finally(() => {
        if (!cancelled) setRecommendationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.playerId]);

  useEffect(() => {
    let cancelled = false;
    const playerId = Number(draft.playerId);
    const wage = Number(draft.wage);
    if (!playerId || !wage || contractYears === 0) {
      setWarnings([]);
      return undefined;
    }

    setWarningLoading(true);
    const timer = setTimeout(() => {
      validateContractTermsAction({ playerId, wage, contractYears })
        .then((response) => {
          if (cancelled) return;
          setWarnings(response.ok ? response.warnings : []);
        })
        .finally(() => {
          if (!cancelled) setWarningLoading(false);
        });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.playerId, draft.wage, contractYears]);

  useEffect(() => {
    let cancelled = false;
    const playerId = Number(draft.playerId);
    const wage = Number(draft.wage);
    if (!playerId || !wage) {
      setSuccessPreview(null);
      return undefined;
    }

    setPreviewLoading(true);
    const timer = setTimeout(() => {
      getNegotiationPreview({ playerId, wage })
        .then((response) => {
          if (cancelled) return;
          setSuccessPreview(response.ok ? { successRate: response.preview.successRate, expectedWage: response.preview.expectedWage } : null);
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.playerId, draft.wage]);

  const handleSubmit = () => {
    setResultMessage(null);
    setContractId(null);

    startTransition(async () => {
      const response = await createContract({
        playerId: Number(draft.playerId),
        teamId: Number(draft.teamId),
        startDate: draft.startDate,
        endDate: draft.endDate,
        wage: Number(draft.wage),
      });

      if (!response.ok) {
        setResultMessage(response.error.message);
        await onRefreshDashboard();
        return;
      }

      setContractId(response.contractId);
      setResultMessage('契約が作成されました。');
      setDraft(initialDraft);
      await onRefreshDashboard();
    });
  };

  return (
    <section className="space-y-6">
      <PanelGrid>
        <PhaseProgress phase={dashboardData?.phase ?? null} />
        <GoalPanel goals={dashboardData?.goals ?? []} />
        <ActionFeedback latestAction={latestAction} isPending={isPending} />
        <ScorePanel score={dashboardData?.score ?? null} />
      </PanelGrid>
      <ActionHistory actions={dashboardData?.recentActions ?? []} />
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">契約を開始</h1>
        <p className="text-sm text-slate-600">
          選手・クラブの選択から条件入力、確認、確定までをホーム画面で完結できます。
        </p>
        <ol className="list-decimal list-inside text-sm text-slate-500 space-y-1">
          <li>ユーザーを選択または作成</li>
          <li>選手とクラブを選択</li>
          <li>契約期間と報酬を入力</li>
          <li>内容を確認して確定</li>
        </ol>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {canStart
            ? `契約可能: 選手 ${players.length} 名 / クラブ ${teams.length} 件`
            : '契約対象がまだ登録されていません。'}
        </div>
        {currentUser && <p className="text-sm text-slate-600">現在のユーザー: {currentUser.name}</p>}
      </header>

      {!canStart && (
        <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          契約対象がないため、まず選手とクラブを登録してください。
          <div className="mt-2 flex flex-wrap gap-3">
            <Link className="text-blue-600 hover:underline" href="/players">
              選手を登録する
            </Link>
            <Link className="text-blue-600 hover:underline" href="/teams">
              クラブを登録する
            </Link>
          </div>
        </div>
      )}

      {canStart && !started && (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setStarted(true)}
        >
          契約を開始する
        </button>
      )}

      {canStart && started && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">契約対象の選択</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="playerId" className="text-sm font-medium text-slate-700">
                  選手
                  <span className="ml-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500" title="選手の市場価値・年齢・能力値から推奨条件を算出します。">
                    ?
                  </span>
                </label>
                <select
                  id="playerId"
                  name="playerId"
                  value={draft.playerId}
                  onChange={handleDraftChange('playerId')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">選手を選択してください</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                {selectedPlayer && (
                  <p className="text-xs text-slate-500">
                    {selectedPlayer.name} {selectedPlayer.meta ? `(${selectedPlayer.meta})` : ''}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="teamId" className="text-sm font-medium text-slate-700">
                  クラブ
                  <span className="ml-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500" title="クラブは契約先です。">
                    ?
                  </span>
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={draft.teamId}
                  onChange={handleDraftChange('teamId')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">クラブを選択してください</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {selectedTeam && (
                  <p className="text-xs text-slate-500">
                    {selectedTeam.name} {selectedTeam.meta ? `(${selectedTeam.meta})` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-800">推奨条件</p>
              {recommendationLoading && <p className="mt-1 text-xs text-slate-500">推奨条件を算出中...</p>}
              {!recommendationLoading && recommendation ? (
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>
                    推奨年俸: {recommendation.wageRange.min} 〜 {recommendation.wageRange.max}
                  </p>
                  <p>
                    推奨契約期間: {recommendation.contractYears.min} 〜 {recommendation.contractYears.max} 年
                  </p>
                  <p className="text-[11px] text-slate-500">{recommendation.rationale}</p>
                </div>
              ) : (
                !recommendationLoading && <p className="mt-1 text-xs text-slate-500">選手を選択すると推奨条件が表示されます。</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">契約条件の入力</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                  契約開始日
                  <span className="ml-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500" title="契約期間から契約年数を計算します。">
                    ?
                  </span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={draft.startDate}
                  onChange={handleDraftChange('startDate')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                  契約終了日
                  <span className="ml-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500" title="契約年数が長すぎる場合は警告を表示します。">
                    ?
                  </span>
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={draft.endDate}
                  onChange={handleDraftChange('endDate')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="wage" className="text-sm font-medium text-slate-700">
                  報酬（週給）
                  <span className="ml-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500" title="市場価値に対する比率で妥当性を検証します。">
                    ?
                  </span>
                </label>
                <input
                  id="wage"
                  name="wage"
                  type="number"
                  min={1}
                  value={draft.wage}
                  onChange={handleDraftChange('wage')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
              <div className="flex items-center justify-between">
                <p className="font-medium">契約条件の警告</p>
                {warningLoading && <span className="text-xs text-amber-500">判定中...</span>}
              </div>
              {warnings.length === 0 ? (
                <p className="mt-1 text-xs text-amber-600">警告はありません。</p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs">
                  {warnings.map((warning) => (
                    <li key={warning.type}>{warning.message}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-700">入力内容の要約</p>
              <ul className="mt-2 space-y-1">
                <li>選手: {selectedPlayer?.name ?? '未選択'}</li>
                <li>クラブ: {selectedTeam?.name ?? '未選択'}</li>
                <li>期間: {draft.startDate || '未入力'} 〜 {draft.endDate || '未入力'}</li>
                <li>契約年数: {contractYears ? `${contractYears} 年` : '未計算'}</li>
                <li>報酬: {draft.wage || '未入力'}</li>
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h2 className="text-base font-semibold text-slate-800">契約内容の確認</h2>
            <p className="text-sm text-slate-600">
              内容を確認し、問題なければ契約を確定してください。
            </p>
            {validationErrors.length > 0 && (
              <ul className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 space-y-1">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <p className="font-medium">交渉成功率</p>
                {previewLoading && <span className="text-xs text-slate-400">算出中...</span>}
              </div>
              {successPreview ? (
                <p className="mt-1 text-sm font-semibold text-slate-900">成功率: {Math.round(successPreview.successRate * 100)}%</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">選手と年俸を入力すると成功率が表示されます。</p>
              )}
              {successPreview && (
                <p className="mt-1 text-xs text-slate-500">期待年俸: {successPreview.expectedWage}</p>
              )}
            </div>
            {isPending && (
              <p className="text-sm text-blue-600">契約確定処理中...</p>
            )}
            {resultMessage && (
              <p className="text-sm text-slate-700">{resultMessage}</p>
            )}
            {contractId && (
              <p className="text-sm text-slate-700">契約ID: {contractId}</p>
            )}
            <button
              type="button"
              data-testid="contract-submit"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              title={warnings.length > 0 ? warnings.map((warning) => warning.message).join('\n') : undefined}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              契約を確定する
            </button>
            {warnings.length > 0 && (
              <span className="ml-3 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                警告あり
              </span>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
