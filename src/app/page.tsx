import Link from 'next/link';
import prisma from '@/lib/prisma';
import ContractFlow from './contracts/ContractFlow';
import { getCurrentUser, listUsers } from './contracts/user-actions';

export default async function Home() {
  const [players, teams, users, currentUserResult] = await Promise.all([
    prisma.player.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, position: true, currentClub: true },
    }),
    prisma.team.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, country: true },
    }),
    listUsers(),
    getCurrentUser(),
  ]);

  const currentUser = currentUserResult.ok
    ? { id: currentUserResult.userId, name: currentUserResult.displayName }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-blue-600">FootballContractSim</p>
          <h1 className="text-3xl font-bold">契約を開始してシミュレーションを進める</h1>
          <p className="text-sm text-slate-600">
            選手とクラブを選び、契約条件を入力して確定までをこの画面で行えます。
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-blue-600 hover:underline" href="/players">
              選手管理へ
            </Link>
            <Link className="text-blue-600 hover:underline" href="/teams">
              クラブ管理へ
            </Link>
          </div>
        </header>

        <ContractFlow
          players={players.map((player) => ({
            id: player.id,
            name: player.name,
            meta: player.position ? `${player.position}${player.currentClub ? ` / ${player.currentClub}` : ''}` : null,
          }))}
          teams={teams.map((team) => ({
            id: team.id,
            name: team.name,
            meta: team.country ?? null,
          }))}
          users={users}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
