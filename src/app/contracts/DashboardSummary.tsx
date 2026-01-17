'use client';

import type { GameplayDashboardData } from './gameplay-state-service';

export default function DashboardSummary({ summary }: { summary: GameplayDashboardData['summary'] | null }) {
  if (!summary) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800">ダッシュボード</h2>
        <p className="mt-2 text-sm text-slate-500">まだデータがありません。契約を進めて状況を更新しましょう。</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">ダッシュボード</h2>
        <span className="text-xs text-slate-400">クラブ状況のサマリ</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">登録選手</p>
          <p className="text-lg font-semibold text-slate-900">{summary.playerCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">登録クラブ</p>
          <p className="text-lg font-semibold text-slate-900">{summary.teamCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">進行中の目標</p>
          <p className="text-lg font-semibold text-slate-900">{summary.activeGoals}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
        次のアクション: {summary.nextActionLabel}
      </div>
    </section>
  );
}
