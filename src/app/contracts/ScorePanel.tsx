'use client';

import type { ScoreSnapshot } from './gameplay-state-service';

export default function ScorePanel({ score }: { score: ScoreSnapshot | null }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">スコア</h3>
        <span className="text-xs text-slate-400">評価指標</span>
      </div>
      {score ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">総合スコア</p>
            <p className="text-2xl font-semibold text-slate-900">{score.totalScore}</p>
          </div>
          <div className="space-y-2">
            {score.metrics.map((metric) => (
              <div key={metric.id} className="rounded-md border border-slate-100 p-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{metric.label}</p>
                  <span className="text-xs text-slate-500">
                    {metric.value}{metric.maxValue ? ` / ${metric.maxValue}` : ''}
                  </span>
                </div>
                {metric.description && <p className="mt-1 text-xs text-slate-500">{metric.description}</p>}
                {metric.missingReason && (
                  <p className="mt-1 text-xs text-amber-600">不足理由: {metric.missingReason}</p>
                )}
                {typeof metric.delta === 'number' && (
                  <p className="mt-1 text-xs text-emerald-600">前回差分: {metric.delta >= 0 ? '+' : ''}{metric.delta}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">算出: {new Date(score.calculatedAt).toLocaleString('ja-JP')}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">スコア指標は契約確定後に表示されます。</p>
      )}
    </section>
  );
}
