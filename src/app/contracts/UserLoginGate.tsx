'use client';

import { useState, useTransition, type ChangeEvent } from 'react';
import { createUser, setCurrentUser } from './user-actions';
import ContractFlow, { type ContractOption } from './ContractFlow';
import DashboardSummary from './DashboardSummary';
import UserContextPanel from './UserContextPanel';
import { getDashboardData, type GameplayDashboardData } from './gameplay-state-service';

type UserLoginGateProps = {
  players: ContractOption[];
  teams: ContractOption[];
  users: { id: number; name: string }[];
  currentUser?: { id: number; name: string } | null;
  initialDashboardData?: GameplayDashboardData | null;
};

type UserOption = { id: number; name: string };

export default function UserLoginGate({
  players,
  teams,
  users,
  currentUser,
  initialDashboardData,
}: UserLoginGateProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser ? String(currentUser.id) : '');
  const [userName, setUserName] = useState('');
  const [userList, setUserList] = useState<UserOption[]>(users);
  const [activeUser, setActiveUser] = useState(currentUser ?? null);
  const [dashboardData, setDashboardData] = useState(initialDashboardData ?? null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshDashboard = async () => {
    const result = await getDashboardData();
    if (result.ok) {
      setDashboardData(result.data);
    }
  };

  const handleUserSelect = () => {
    startTransition(async () => {
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

      setActiveUser({ id: result.userId, name: result.displayName });
      setResultMessage(`現在のユーザー: ${result.displayName}`);
      await refreshDashboard();
    });
  };

  const handleCreateUser = () => {
    startTransition(async () => {
      const result = await createUser({ name: userName });
      if (!result.ok) {
        setResultMessage(result.error.message);
        return;
      }

      setUserList((prev: UserOption[]) => [{ id: result.userId, name: result.displayName }, ...prev]);
      setSelectedUserId(String(result.userId));
      setUserName('');
      setActiveUser({ id: result.userId, name: result.displayName });
      setResultMessage(`現在のユーザー: ${result.displayName}`);
      await refreshDashboard();
    });
  };

  const showDashboard = Boolean(activeUser);

  return (
    <section className="space-y-6">
      {!showDashboard && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold text-slate-800">ユーザーを選択または作成</h2>
          <p className="text-sm text-slate-600">契約フローを開始するにはユーザーを選択してください。</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="currentUser"
              name="currentUser"
              value={selectedUserId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedUserId(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={isPending}
            >
              <option value="">ユーザーを選択してください</option>
              {userList.map((user: UserOption) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleUserSelect}
              disabled={isPending}
            >
              このユーザーを利用
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={userName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setUserName(event.target.value)}
              placeholder="新しいユーザー名"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={isPending}
            />
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleCreateUser}
              disabled={isPending}
            >
              新規ユーザー作成
            </button>
          </div>
          {isPending && <p className="text-sm text-blue-600">処理中...</p>}
          {resultMessage && <p className="text-sm text-slate-700">{resultMessage}</p>}
        </div>
      )}

      {showDashboard && (
        <div className="space-y-6">
          <UserContextPanel user={activeUser} phase={dashboardData?.phase ?? null} />
          <DashboardSummary summary={dashboardData?.summary ?? null} />
          <ContractFlow
            players={players}
            teams={teams}
            dashboardData={dashboardData}
            onRefreshDashboard={refreshDashboard}
            currentUser={activeUser}
          />
        </div>
      )}
    </section>
  );
}
