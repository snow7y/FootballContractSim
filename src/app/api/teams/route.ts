// TEST_COVERAGE:TEAMS_API
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/teams  (一覧)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get('take') ?? '50');
    const skip = Number(searchParams.get('skip') ?? '0');

    const teams = await prisma.team.findMany({
      skip,
      take: Math.min(take, 100),
      orderBy: { id: 'desc' },
    });
    const total = await prisma.team.count();
    return NextResponse.json({ data: teams, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// POST /api/teams (作成)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, country, foundedYear } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    let year: number | null = null;
    if (foundedYear != null) {
      const n = Number(foundedYear);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: 'invalid foundedYear' }, { status: 400 });
      }
      if (n < 1800 || n > 2100) {
        return NextResponse.json({ error: 'foundedYear must be between 1800 and 2100' }, { status: 400 });
      }
      year = n;
    }

    const team = await prisma.team.create({
      data: {
        name,
        country: country ?? null,
        foundedYear: year,
      },
    });

    return NextResponse.json({ data: team }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
