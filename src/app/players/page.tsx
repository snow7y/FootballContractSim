import prisma from '@/lib/prisma';
import PlayerTable from './PlayerTable';
import type { Player } from '@prisma/client';
import CreatePlayerForm from './CreatePlayerForm';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players: Player[] = await prisma.player.findMany({ orderBy: { id: 'desc' } });
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Players</h1>
      <PlayerTable initialPlayers={players} />
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">新規追加</h2>
        <CreatePlayerForm />
      </section>
    </div>
  );
}
