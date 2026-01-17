'use client';

export default function EmptyStateNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1">{detail}</p>
    </div>
  );
}
