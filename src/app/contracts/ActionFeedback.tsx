'use client';

import { useEffect, useState } from 'react';
import type { ActionResultSummary } from './gameplay-state-service';

const STATUS_LABEL: Record<ActionResultSummary['status'], string> = {
  Success: '成功',
  Failure: '失敗',
  Pending: '処理中',
};

export default function ActionFeedback({ latestAction, isPending }: { latestAction: ActionResultSummary | null; isPending: boolean }) {
  const [showFailureAnimation, setShowFailureAnimation] = useState(false);
  const highlights = latestAction?.deltaHighlights?.filter((item) => !item.startsWith('meta:')) ?? [];
  const statusClass =
    latestAction?.status === 'Success'
      ? 'bg-emerald-100 text-emerald-700'
      : latestAction?.status === 'Failure'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-slate-100 text-slate-600';

  useEffect(() => {
    if (!latestAction || latestAction.status !== 'Failure') {
      setShowFailureAnimation(false);
      return undefined;
    }
    setShowFailureAnimation(true);
    const timer = setTimeout(() => setShowFailureAnimation(false), 3000);
    return () => clearTimeout(timer);
  }, [latestAction]);

  return (
    <section
      className={`rounded-xl border bg-white p-4 ${
        showFailureAnimation ? 'border-rose-300 shadow-sm shadow-rose-200 animate-pulse' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">アクション結果</h3>
        {isPending && <span className="text-xs font-medium text-blue-600">処理中...</span>}
      </div>
      {latestAction ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs ${statusClass}`}>
              {STATUS_LABEL[latestAction.status]}
            </span>
            <span className="text-xs text-slate-400">{new Date(latestAction.occurredAt).toLocaleString('ja-JP')}</span>
          </div>
          <p>{latestAction.message}</p>
          {latestAction.hint && <p className="text-xs text-amber-600">ヒント: {latestAction.hint}</p>}
          {highlights.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-600">
              {highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">まだアクション履歴がありません。</p>
      )}
    </section>
  );
}
