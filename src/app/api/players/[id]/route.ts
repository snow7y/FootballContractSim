import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Position } from '@prisma/client';

// GET /api/players/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ data: player });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

// PUT /api/players/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const body = await req.json();
  const { name, position, age, overall, potential, nationality, currentClub, contractUntil, marketValue, wage } = body;

    if (name != null && typeof name !== 'string') return NextResponse.json({ error: 'invalid name' }, { status: 400 });

  const player = await prisma.player.update({
      where: { id },
      data: {
        name,
  position: position && position in Position ? (position as Position) : undefined,
        age: age != null ? Number(age) : undefined,
        overall: overall != null ? Number(overall) : undefined,
        potential: potential != null ? Number(potential) : undefined,
        nationality: nationality ?? undefined,
        currentClub: currentClub ?? undefined,
        contractUntil: contractUntil ? new Date(contractUntil) : undefined,
        marketValue: marketValue != null ? Number(marketValue) : undefined,
        wage: wage != null ? Number(wage) : undefined,
      },
    });
    return NextResponse.json({ data: player });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

// DELETE /api/players/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
