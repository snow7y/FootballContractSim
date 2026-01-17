'use client';

import type { GoalState } from './gameplay-state-service';

const STATUS_STYLE: Record<GoalState['status'], string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Completed: 'bg-blue-50 text-blue-700',
  Expired: 'bg-amber-50 text-amber-700',
  Disabled: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<GoalState['status'], string> = {
  Active: '進行中',
  Completed: '達成',
  Expired: '期限切れ',
  Disabled: '無効',
};

export default function GoalPanel({ goals }: { goals: GoalState[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">目標</h3>
        <span className="text-xs text-slate-400">達成状況を確認</span>
      </div>
      {goals.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">現在有効な目標がありません。</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {goals.map((goal) => (
            <li key={goal.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{goal.title}</p>
                  {goal.description && <p className="mt-1 text-xs text-slate-500">{goal.description}</p>}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[goal.status]}`}>
                  {STATUS_LABEL[goal.status]}
                </span>
              </div>
              {(goal.progressLabel || goal.reason) && (
                <div className="mt-2 text-xs text-slate-500">
                  {goal.progressLabel && <span>進捗: {goal.progressLabel}</span>}
                  {goal.reason && <span className="ml-2">理由: {goal.reason}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
