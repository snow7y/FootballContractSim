import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Position } from '@prisma/client';

// GET /api/players  (一覧)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get('take') ?? '50');
    const skip = Number(searchParams.get('skip') ?? '0');
    const players = await prisma.player.findMany({
      skip,
      take: Math.min(take, 100),
      orderBy: { id: 'desc' },
    });
    const total = await prisma.player.count();
    return NextResponse.json({ data: players, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

// POST /api/players (作成)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
  const { name, position, age, overall, potential, nationality, currentClub, contractUntil, marketValue, wage } = body;

    // 簡易バリデーション
  if (!name || typeof name !== 'string') return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!position || typeof position !== 'string') return NextResponse.json({ error: 'position is required' }, { status: 400 });
  if (!(position in Position)) return NextResponse.json({ error: 'invalid position' }, { status: 400 });
  if (age == null || Number.isNaN(Number(age))) return NextResponse.json({ error: 'age is required' }, { status: 400 });
  if (overall == null || Number.isNaN(Number(overall))) return NextResponse.json({ error: 'overall is required' }, { status: 400 });
  if (potential == null || Number.isNaN(Number(potential))) return NextResponse.json({ error: 'potential is required' }, { status: 400 });

    const player = await prisma.player.create({
      data: {
        name,
        position: position as Position,
        age: Number(age),
        overall: Number(overall),
        potential: Number(potential),
        nationality: nationality ?? null,
        currentClub: currentClub ?? null,
        contractUntil: contractUntil ? new Date(contractUntil) : null,
        marketValue: marketValue != null ? Number(marketValue) : null,
        wage: wage != null ? Number(wage) : null,
      },
    });

    return NextResponse.json({ data: player }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
