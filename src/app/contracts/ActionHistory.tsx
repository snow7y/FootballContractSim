'use client';

import type { ActionResultSummary } from './gameplay-state-service';

export default function ActionHistory({ actions }: { actions: ActionResultSummary[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">履歴</h3>
        <span className="text-xs text-slate-400">直近の進行ログ</span>
      </div>
      {actions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">履歴がまだありません。</p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm text-slate-700">
          {actions.map((action) => (
            <li key={action.id} className="rounded-md border border-slate-100 p-3">
              <p className="font-medium">
                <span className="mr-2">
                  {action.status === 'Success' ? '✅' : action.status === 'Failure' ? '❌' : '⏳'}
                </span>
                {action.message}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {action.actionType} ・ {new Date(action.occurredAt).toLocaleString('ja-JP')}
              </p>
              {action.hint && <p className="mt-1 text-xs text-amber-600">ヒント: {action.hint}</p>}
              {action.deltaHighlights && action.deltaHighlights.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-600">
                  {action.deltaHighlights
                    .filter((highlight) => !highlight.startsWith('meta:'))
                    .map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
