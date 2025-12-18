import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/teams/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ data: team });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

// PUT /api/teams/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const body = await req.json();
    const { name, country, foundedYear } = body;

    if (name != null && typeof name !== 'string') {
      return NextResponse.json({ error: 'invalid name' }, { status: 400 });
    }

    let year: number | undefined;
    if (foundedYear != null) {
      const n = Number(foundedYear);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: 'invalid foundedYear' }, { status: 400 });
      }
      year = n;
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: name ?? undefined,
        country: country ?? undefined,
        foundedYear: year,
      },
    });
    return NextResponse.json({ data: team });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

// DELETE /api/teams/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
