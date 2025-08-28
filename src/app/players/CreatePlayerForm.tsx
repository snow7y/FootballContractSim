"use client";
import { useTransition } from 'react';
import { createPlayer } from './actions';
import { POSITIONS } from '@/domain/positions';
import { useRouter } from 'next/navigation';

export default function CreatePlayerForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // capture before async boundary
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    startTransition(async () => {
      try {
        await createPlayer({
          name: data.name as string,
          position: data.position as string,
          age: Number(data.age),
          overall: Number(data.overall),
          potential: Number(data.potential),
          nationality: (data.nationality as string) || null,
          currentClub: (data.currentClub as string) || null,
          contractUntil: (data.contractUntil as string) || null,
          marketValue: data.marketValue ? Number(data.marketValue) : null,
          wage: data.wage ? Number(data.wage) : null,
        });
        form.reset();
        router.refresh();
      } catch (err) {
        console.error('Create player failed', err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 text-sm">
      <div className="col-span-full text-xs text-gray-600"><span className="text-red-500">*</span> は必須項目 / 数値範囲はバリデーション条件です</div>
  <Field label="Name" id="name" required description="選手名 (必須)"><input id="name" name="name" required className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" placeholder="例: Lionel Messi" /></Field>
      <Field label="Position" id="position" required description="ポジション (必須) - Prisma enum から選択">
        <select
          id="position"
          name="position"
          required
          defaultValue=""
          className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-white focus:border-white appearance-none dark:border-zinc-600"
        >
          <option value="" disabled className=''>選択...</option>
          {POSITIONS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>
  <Field label="Age" id="age" required description="年齢 (15〜60 歳 / 必須)"><input id="age" name="age" type="number" required min={15} max={60} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" /></Field>
  <Field label="Overall" id="overall" required description="現在能力 (0〜100 / 必須)"><input id="overall" name="overall" type="number" required min={0} max={100} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" /></Field>
  <Field label="Potential" id="potential" required description="潜在能力 (0〜100 / 必須)"><input id="potential" name="potential" type="number" required min={0} max={100} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" /></Field>
  <Field label="Nationality" id="nationality" description="国籍 (任意)"><input id="nationality" name="nationality" className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" placeholder="例: Argentina" /></Field>
  <Field label="Club" id="currentClub" description="所属クラブ (任意)"><input id="currentClub" name="currentClub" className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" placeholder="例: Inter Miami" /></Field>
  <Field label="Contract Until" id="contractUntil" description="契約満了日 (任意)"><input id="contractUntil" name="contractUntil" type="date" className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" /></Field>
  <Field label="Market Value" id="marketValue" description="市場価値 (任意 / 数値, 通貨単位は任意)"><input id="marketValue" name="marketValue" type="number" min={0} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" placeholder="例: 75000000" /></Field>
  <Field label="Wage" id="wage" description="週給 (任意 / 数値)"><input id="wage" name="wage" type="number" min={0} className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600" placeholder="例: 500000" /></Field>
      <div className="col-span-full"><button disabled={isPending} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">追加</button></div>
    </form>
  );
}

function Field({ label, id, children, description, required }: { label: string; id: string; children: React.ReactNode; description?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="font-medium flex items-center gap-1" htmlFor={id}>
        {label}{required && <span className="text-red-500" title="必須">*</span>}
      </label>
      {children}
      {description && <p className="text-[10px] text-gray-500 leading-snug">{description}</p>}
    </div>
  );
}
