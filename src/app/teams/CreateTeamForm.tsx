"use client";
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam } from './actions';

export default function CreateTeamForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('name') as string) ?? '';
    const country = (fd.get('country') as string) || null;
    const foundedYearRaw = fd.get('foundedYear') as string | null;
    const foundedYear = foundedYearRaw ? Number(foundedYearRaw) : null;

    startTransition(async () => {
      try {
        await createTeam({
          name,
          country,
          foundedYear,
        });
        form.reset();
        router.refresh();
      } catch (err) {
        console.error('Create team failed', err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4 text-sm">
      <div className="col-span-full text-xs text-gray-600">
        <span className="text-red-500">*</span> は必須項目です
      </div>
      <Field label="Name" id="name" required>
        <input
          id="name"
          name="name"
          required
          className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
          placeholder="例: FC Example"
        />
      </Field>
      <Field label="Country" id="country">
        <input
          id="country"
          name="country"
          className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
          placeholder="例: Japan"
        />
      </Field>
      <Field label="Founded Year" id="foundedYear">
        <input
          id="foundedYear"
          name="foundedYear"
          type="number"
          min={1800}
          max={2100}
          className="border px-2 py-1 rounded bg-white dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
          placeholder="例: 1999"
        />
      </Field>
      <div className="col-span-full">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          追加
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  children,
  required,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="font-medium flex items-center gap-1" htmlFor={id}>
        {label}
        {required && (
          <span className="text-red-500" title="必須">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
