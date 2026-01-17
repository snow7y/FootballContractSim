'use client';

import type { PhaseProgressState } from './gameplay-state-service';

export default function UserContextPanel({ user, phase }: { user: { id: number; name: string } | null; phase: PhaseProgressState | null }) {
  if (!user) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-800">現在のユーザー</h2>
      <p className="mt-2 text-sm text-slate-600">{user.name}</p>
      {phase && (
        <p className="mt-2 text-xs text-slate-500">現在のフェーズ: {phase.phaseLabel}</p>
      )}
    </section>
  );
}
