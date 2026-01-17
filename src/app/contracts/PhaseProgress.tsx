'use client';

import type { PhaseProgressState } from './gameplay-state-service';

const STATUS_LABELS: Record<PhaseProgressState['status'], string> = {
  NotStarted: '未開始',
  InProgress: '進行中',
  Completed: '完了',
};

export default function PhaseProgress({ phase }: { phase: PhaseProgressState | null }) {
  if (!phase) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">フェーズ進行</h3>
        <p className="mt-2 text-sm text-slate-500">フェーズがまだ開始されていません。</p>
        <p className="mt-1 text-xs text-slate-400">残りステップはフェーズ開始後に表示されます。</p>
      </section>
    );
  }

  const remaining = Math.max(phase.totalSteps - phase.stepIndex - 1, 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">フェーズ進行</h3>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
          {STATUS_LABELS[phase.status]}
        </span>
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>現在のフェーズ: {phase.phaseLabel}</p>
        <p>
          ステップ {phase.stepIndex + 1} / {phase.totalSteps}
          <span className="ml-2 text-xs text-slate-500">残り {remaining} ステップ</span>
        </p>
      </div>
      <p className="mt-2 text-xs text-slate-500">更新: {new Date(phase.updatedAt).toLocaleString('ja-JP')}</p>
    </section>
  );
}
