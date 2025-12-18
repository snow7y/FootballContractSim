"use client";
import { useState, useTransition } from 'react';
import type { Team } from '@prisma/client';
import { updateTeam, deleteTeam } from './actions';

interface TeamTableProps {
  initialTeams: Team[];
}

export default function TeamTable({ initialTeams }: TeamTableProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(id: number) {
    setEditingId(id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleLocalDelete(id: number) {
    startTransition(async () => {
      try {
        await deleteTeam(id);
        setTeams(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error('Delete team failed', err);
      }
    });
  }

  function handleLocalSave(id: number, form: HTMLFormElement) {
    const fd = new FormData(form);
    const name = (fd.get('name') as string) || '';
    const country = (fd.get('country') as string) || '';
    const foundedYearRaw = fd.get('foundedYear') as string | null;
    const foundedYear = foundedYearRaw ? Number(foundedYearRaw) : undefined;

    startTransition(async () => {
      try {
        const updated = await updateTeam(id, {
          name: name || undefined,
          country: country || null,
          foundedYear:
            foundedYear != null && !Number.isNaN(foundedYear) ? foundedYear : undefined,
        });
        setTeams(prev => prev.map(team => (team.id === id ? updated : team)));
        setEditingId(null);
      } catch (err) {
        console.error('Update team failed', err);
      }
    });
  }

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-500 text-left">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Country</th>
            <th className="p-2">Founded</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => {
            const editing = editingId === team.id;
            const formId = `edit-team-${team.id}`;
            return (
              <tr key={team.id} className="border-t">
                <td className="p-2">{team.id}</td>
                <td className="p-2">
                  {editing ? (
                    <input
                      form={formId}
                      name="name"
                      defaultValue={team.name}
                      className="border px-1"
                    />
                  ) : (
                    team.name
                  )}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input
                      form={formId}
                      name="country"
                      defaultValue={team.country ?? ''}
                      className="border px-1"
                    />
                  ) : (
                    team.country ?? '-'
                  )}
                </td>
                <td className="p-2">
                  {editing ? (
                    <input
                      form={formId}
                      name="foundedYear"
                      type="number"
                      defaultValue={team.foundedYear ?? ''}
                      className="border px-1 w-20"
                    />
                  ) : (
                    team.foundedYear ?? '-'
                  )}
                </td>
                <td className="p-2 space-x-2">
                  {editing ? (
                    <form
                      id={formId}
                      onSubmit={e => {
                        e.preventDefault();
                        handleLocalSave(team.id, e.currentTarget);
                      }}
                      className="inline"
                    >
                      <button
                        type="submit"
                        data-testid="edit-button"
                        className="text-blue-600 hover:underline mr-2"
                        disabled={isPending}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        className="text-gray-500 hover:underline"
                        onClick={cancelEdit}
                        disabled={isPending}
                      >
                        キャンセル
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        data-testid="edit-button"
                        className="text-blue-600 hover:underline"
                        onClick={() => startEdit(team.id)}
                        disabled={isPending}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        data-testid="delete-button"
                        className="text-red-600 hover:underline"
                        onClick={() => handleLocalDelete(team.id)}
                        disabled={isPending}
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {teams.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                まだチームが登録されていません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
