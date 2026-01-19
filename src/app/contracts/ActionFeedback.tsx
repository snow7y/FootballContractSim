'use client';

import type { ActionResultSummary } from './gameplay-state-service';

const STATUS_LABEL: Record<ActionResultSummary['status'], string> = {
  Success: '成功',
  Failure: '失敗',
  Pending: '処理中',
};

export default function ActionFeedback({ latestAction, isPending }: { latestAction: ActionResultSummary | null; isPending: boolean }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">アクション結果</h3>
        {isPending && <span className="text-xs font-medium text-blue-600">処理中...</span>}
      </div>
      {latestAction ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {STATUS_LABEL[latestAction.status]}
            </span>
            <span className="text-xs text-slate-400">{new Date(latestAction.occurredAt).toLocaleString('ja-JP')}</span>
          </div>
          <p>{latestAction.message}</p>
          {latestAction.hint && <p className="text-xs text-amber-600">ヒント: {latestAction.hint}</p>}
          {latestAction.deltaHighlights && latestAction.deltaHighlights.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-600">
              {latestAction.deltaHighlights.map((highlight) => (
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
