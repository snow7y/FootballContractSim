'use server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import type { Team } from '@prisma/client';

// TEST_COVERAGE:TEAM_ACTIONS
interface BaseTeamInput {
  name: string;
  country?: string | null;
  foundedYear?: number | null;
}

function validateTeamInput(input: Partial<BaseTeamInput>, partial = false) {
  const errors: string[] = [];

  if (!partial) {
    if (input.name == null || input.name.toString().trim() === '') {
      errors.push('name is required');
    }
  } else if ('name' in input && input.name != null && input.name.toString().trim() === '') {
    errors.push('name cannot be empty');
  }

  if (input.foundedYear != null) {
    const year = input.foundedYear;
    if (typeof year !== 'number' || Number.isNaN(year) || year < 1800 || year > 2100) {
      errors.push('foundedYear must be between 1800 and 2100');
    }
  }

  if (errors.length) {
    throw new Error(errors.join(', '));
  }
}

export async function createTeam(input: BaseTeamInput): Promise<Team> {
  validateTeamInput(input, false);

  const team = await prisma.team.create({
    data: {
      name: input.name,
      country: input.country ?? null,
      foundedYear: input.foundedYear ?? null,
    },
  });

  revalidatePath('/teams');
  return team;
}

export async function updateTeam(id: number, input: Partial<BaseTeamInput>): Promise<Team> {
  validateTeamInput(input, true);

  const data: Record<string, unknown> = {};
  if ('name' in input && input.name != null && input.name.toString().trim().length) {
    data.name = input.name;
  }
  if ('country' in input) {
    data.country = input.country ?? null;
  }
  if ('foundedYear' in input) {
    const year = input.foundedYear;
    if (typeof year === 'number' && !Number.isNaN(year)) {
      data.foundedYear = year;
    }
  }

  const team = await prisma.team.update({ where: { id }, data });
  revalidatePath('/teams');
  return team;
}

export async function deleteTeam(id: number): Promise<{ success: boolean }> {
  await prisma.team.delete({ where: { id } });
  revalidatePath('/teams');
  return { success: true };
}
