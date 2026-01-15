'use client';

import { useMemo, useState, useTransition, type ChangeEvent } from 'react';
import Link from 'next/link';
import { createContract } from './contract-actions';
import { createUser, setCurrentUser } from './user-actions';

export type ContractOption = {
  id: number;
  name: string;
  meta?: string | null;
};

type ContractFlowProps = {
  players: ContractOption[];
  teams: ContractOption[];
  users: { id: number; name: string }[];
  currentUser?: { id: number; name: string } | null;
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

export default function ContractFlow({ players, teams, users, currentUser }: ContractFlowProps) {
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [contractId, setContractId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser ? String(currentUser.id) : '');
  const [userName, setUserName] = useState('');
  const [userList, setUserList] = useState(users);

  const canStart = players.length > 0 && teams.length > 0;

  const selectedPlayer = useMemo(
    () => players.find((player) => String(player.id) === draft.playerId) ?? null,
    [players, draft.playerId]
  );
  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.id) === draft.teamId) ?? null,
    [teams, draft.teamId]
  );

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedUserId) errors.push('ユーザーを選択してください');
    if (!draft.playerId) errors.push('選手を選択してください');
    if (!draft.teamId) errors.push('クラブを選択してください');
    if (!draft.startDate) errors.push('開始日を入力してください');
    if (!draft.endDate) errors.push('終了日を入力してください');
    if (!draft.wage || Number(draft.wage) <= 0) errors.push('報酬は正の数値を入力してください');
    if (draft.startDate && draft.endDate && new Date(draft.startDate) >= new Date(draft.endDate)) {
      errors.push('契約期間は開始日より終了日を後にしてください');
    }
    return errors;
  }, [draft, selectedUserId]);

  const isSubmitDisabled = validationErrors.length > 0 || isPending;

  const handleDraftChange =
    (field: keyof DraftState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));
    setResultMessage(null);
    setContractId(null);
  };

  const handleUserSelect = async () => {
    const userId = Number(selectedUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      setResultMessage('ユーザーを選択してください。');
      return;
    }

    const result = await setCurrentUser({ userId });
    if (!result.ok) {
      setResultMessage(result.error.message);
      return;
    }

    setResultMessage(`現在のユーザー: ${result.displayName}`);
  };

  const handleCreateUser = async () => {
    const result = await createUser({ name: userName });
    if (!result.ok) {
      setResultMessage(result.error.message);
      return;
    }

    setUserList((prev) => [{ id: result.userId, name: result.displayName }, ...prev]);
    setSelectedUserId(String(result.userId));
    setUserName('');
    setResultMessage(`現在のユーザー: ${result.displayName}`);
  };

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
        return;
      }

      setContractId(response.contractId);
      setResultMessage('契約が作成されました。');
      setDraft(initialDraft);
    });
  };

  return (
    <section className="space-y-6">
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
          <section className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h2 className="text-base font-semibold text-slate-800">ユーザーの選択</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                id="currentUser"
                name="currentUser"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">ユーザーを選択してください</option>
                {userList.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={handleUserSelect}
              >
                このユーザーを利用
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                placeholder="新しいユーザー名"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={handleCreateUser}
              >
                新規ユーザー作成
              </button>
            </div>
            {currentUser && (
              <p className="text-sm text-slate-600">現在のユーザー: {currentUser.name}</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">契約対象の選択</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="playerId" className="text-sm font-medium text-slate-700">
                  選手
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
          </section>

          <section className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">契約条件の入力</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                  契約開始日
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

            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-700">入力内容の要約</p>
              <ul className="mt-2 space-y-1">
                <li>選手: {selectedPlayer?.name ?? '未選択'}</li>
                <li>クラブ: {selectedTeam?.name ?? '未選択'}</li>
                <li>期間: {draft.startDate || '未入力'} 〜 {draft.endDate || '未入力'}</li>
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
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              契約を確定する
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
