// TEST_COVERAGE:TEAMS_PAGE_FLOW
import prisma from '@/lib/prisma';
import type { Team } from '@prisma/client';
import CreateTeamForm from './CreateTeamForm';
import TeamTable from './TeamTable';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const teams: Team[] = await prisma.team.findMany({ orderBy: { id: 'desc' } });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Teams</h1>
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">チーム一覧</h2>
        <TeamTable initialTeams={teams} />
      </section>
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">新規チーム追加</h2>
        <CreateTeamForm />
      </section>
    </div>
  );
}
