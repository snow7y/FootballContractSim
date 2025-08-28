'use client';
import { useState, useTransition } from 'react';
import { deletePlayer, updatePlayer } from './actions';
// Local input type aligned with server action BaseInput (subset) to avoid any
interface UpdateInput {
  name?: string;
  position?: string;
  age?: number;
  overall?: number;
  potential?: number;
  nationality?: string | null;
  currentClub?: string | null;
  contractUntil?: string | null;
  marketValue?: number | null;
  wage?: number | null;
}
import type { Player } from '@prisma/client';

export default function PlayerTable({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(id: number) {
    setEditingId(id);
  }
  function cancelEdit() {
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    startTransition(async () => {
      await deletePlayer(id);
      setPlayers(p => p.filter(pl => pl.id !== id));
    });
  }

  async function handleSave(id: number, form: HTMLFormElement) {
    const fd = new FormData(form);
  const payload: Record<string, FormDataEntryValue> = {};
    fd.forEach((v, k) => { payload[k] = v; });
    startTransition(async () => {
      const buildNumber = (key: string) => {
        const raw = payload[key];
        if (raw == null || raw === '') return undefined;
        const num = Number(raw);
        return Number.isNaN(num) ? undefined : num;
      };
  const updateInput: UpdateInput = {
        name: (payload.name as string) || undefined,
        position: (payload.position as string) || undefined,
        age: buildNumber('age'),
        overall: buildNumber('overall'),
        potential: buildNumber('potential'),
        nationality: (payload.nationality as string) || undefined,
        currentClub: (payload.currentClub as string) || undefined,
        contractUntil: (payload.contractUntil as string) || undefined,
        marketValue: buildNumber('marketValue'),
        wage: buildNumber('wage'),
      };
      const updated = await updatePlayer(id, updateInput);
  setPlayers(pls => pls.map(p => (p.id === id ? updated : p)));
      setEditingId(null);
    });
  }

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-500 text-left">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Pos</th>
            <th className="p-2">Age</th>
            <th className="p-2">Ovr</th>
            <th className="p-2">Pot</th>
            <th className="p-2">Club</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => {
            const editing = editingId === p.id;
            const formId = `edit-${p.id}`;
            return (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.id}</td>
                <td className="p-2">
                  {editing ? (
                    <input form={formId} name="name" defaultValue={p.name} className="border px-1" />
                  ) : p.name}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input form={formId} name="position" defaultValue={p.position} className="border px-1 w-16" />
                  ) : p.position}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input form={formId} name="age" type="number" defaultValue={p.age} className="border px-1 w-16" />
                  ) : p.age}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input form={formId} name="overall" type="number" defaultValue={p.overall} className="border px-1 w-16" />
                  ) : p.overall}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input form={formId} name="potential" type="number" defaultValue={p.potential} className="border px-1 w-16" />
                  ) : p.potential}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input form={formId} name="currentClub" defaultValue={p.currentClub ?? ''} className="border px-1 w-28" />
                  ) : (p.currentClub ?? '-')}
                </td>
                <td className="p-2 space-x-2">
                  {editing ? (
                    <form id={formId} onSubmit={e => { e.preventDefault(); handleSave(p.id, e.currentTarget); }} className="inline">
                      <button type="submit" className="text-blue-600 hover:underline mr-2" disabled={isPending}>保存</button>
                      <button type="button" onClick={cancelEdit} className="text-gray-500 hover:underline" disabled={isPending}>キャンセル</button>
                    </form>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(p.id)} className="text-blue-600 hover:underline" disabled={isPending}>編集</button>
                      <button type="button" onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline" disabled={isPending}>削除</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {players.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">No players</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
