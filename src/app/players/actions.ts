'use server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import type { Position } from '@prisma/client';

interface BaseInput {
  name: string;
  position: string; // will be validated against Position enum
  age: number;
  overall: number;
  potential: number;
  nationality?: string | null;
  currentClub?: string | null;
  contractUntil?: string | null; // ISO string from form
  marketValue?: number | null;
  wage?: number | null;
}

function validate(input: Partial<BaseInput>, partial = false) {
  const errors: string[] = [];
  const required: (keyof BaseInput)[] = ['name', 'position', 'age', 'overall', 'potential'];
  if (!partial) {
    for (const key of required) {
      if (input[key] == null || input[key] === '') errors.push(`${key} is required`);
    }
  }
  if (input.age != null && (input.age < 15 || input.age > 60)) errors.push('age must be 15-60');
  for (const k of ['overall', 'potential'] as const) {
    const v = input[k] as number | undefined;
    if (v != null && (v < 0 || v > 100)) errors.push(`${k} must be 0-100`);
  }
  if (errors.length) throw new Error(errors.join(', '));
}

export async function createPlayer(input: BaseInput) {
  validate(input);
  const player = await prisma.player.create({
    data: {
      name: input.name,
      position: input.position as Position,
      age: input.age,
      overall: input.overall,
      potential: input.potential,
      nationality: input.nationality ?? null,
      currentClub: input.currentClub ?? null,
      contractUntil: input.contractUntil ? new Date(input.contractUntil) : null,
      marketValue: input.marketValue ?? null,
      wage: input.wage ?? null,
    },
  });
  revalidatePath('/players');
  return player;
}

export async function updatePlayer(id: number, input: Partial<BaseInput>) {
  validate(input, true);
  const data: Record<string, unknown> = {};
  if ('name' in input && typeof input.name === 'string' && input.name.length) data.name = input.name;
  if ('position' in input && input.position) data.position = input.position as Position;
  const numericKeys: (keyof BaseInput)[] = ['age','overall','potential','marketValue','wage'];
  for (const k of numericKeys) {
    if (k in input) {
      const v = input[k];
      if (typeof v === 'number' && !Number.isNaN(v)) data[k] = v;
    }
  }
  if ('nationality' in input) data.nationality = input.nationality ?? null;
  if ('currentClub' in input) data.currentClub = input.currentClub ?? null;
  if ('contractUntil' in input) data.contractUntil = input.contractUntil ? new Date(input.contractUntil) : null;
  const player = await prisma.player.update({ where: { id }, data });
  revalidatePath('/players');
  return player;
}

export async function deletePlayer(id: number) {
  await prisma.player.delete({ where: { id } });
  revalidatePath('/players');
  return { success: true };
}
