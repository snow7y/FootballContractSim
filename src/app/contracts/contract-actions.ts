'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './user-actions';
import { recordAction, refreshScore, updatePhase } from './gameplay-state-service';

export type ContractCreateInput = {
  playerId: number;
  teamId: number;
  startDate: string;
  endDate: string;
  wage: number;
};

export type ContractCreateError =
  | { type: 'UserContextMissing'; message: string }
  | { type: 'Validation'; message: string; fields: string[] }
  | { type: 'NotFound'; message: string }
  | { type: 'Conflict'; message: string }
  | { type: 'System'; message: string };

export type ContractCreateResult =
  | { ok: true; contractId: number }
  | { ok: false; error: ContractCreateError };

export type ContractGetResult =
  | {
      ok: true;
      contract: {
        id: number;
        playerId: number;
        teamId: number;
        userId: number;
        startDate: Date;
        endDate: Date;
        wage: number;
      };
    }
  | { ok: false; error: ContractCreateError };

function validateContractInput(input: ContractCreateInput) {
  const fields: string[] = [];

  if (!Number.isInteger(input.playerId) || input.playerId <= 0) fields.push('playerId');
  if (!Number.isInteger(input.teamId) || input.teamId <= 0) fields.push('teamId');
  if (!input.startDate) fields.push('startDate');
  if (!input.endDate) fields.push('endDate');
  if (typeof input.wage !== 'number' || Number.isNaN(input.wage) || input.wage <= 0) fields.push('wage');

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime())) fields.push('startDate');
  if (Number.isNaN(end.getTime())) fields.push('endDate');
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start >= end) {
    fields.push('startDate', 'endDate');
  }

  return { fields, start, end };
}

export async function createContract(input: ContractCreateInput): Promise<ContractCreateResult> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return {
        ok: false,
        error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' },
      };
    }

    const validation = validateContractInput(input);
    if (validation.fields.length) {
      await recordAction({
        actionType: 'ContractFailed',
        status: 'Failure',
        message: '契約入力に不備があります。',
        hint: '入力内容を確認してください。',
      });
      return {
        ok: false,
        error: { type: 'Validation', message: '入力内容に不備があります。', fields: validation.fields },
      };
    }

    const [player, team] = await Promise.all([
      prisma.player.findUnique({ where: { id: input.playerId } }),
      prisma.team.findUnique({ where: { id: input.teamId } }),
    ]);

    if (!player || !team) {
      await recordAction({
        actionType: 'ContractFailed',
        status: 'Failure',
        message: '選択された選手またはクラブが見つかりません。',
        hint: '選択内容を再確認してください。',
      });
      return {
        ok: false,
        error: { type: 'NotFound', message: '選択された選手またはクラブが見つかりません。' },
      };
    }

    const created = await prisma.contract.create({
      data: {
        userId: userContext.userId,
        playerId: input.playerId,
        teamId: input.teamId,
        startDate: validation.start,
        endDate: validation.end,
        wage: input.wage,
      },
    });

    await Promise.allSettled([
      updatePhase({
        phaseId: 'contract',
        stepIndex: 3,
        totalSteps: 4,
        status: 'Completed',
      }),
      recordAction({
        actionType: 'ContractCreated',
        status: 'Success',
        message: `契約を作成しました: ${player.name} → ${team.name}`,
        deltaHighlights: ['契約が追加されました', `報酬: ${input.wage}`],
      }),
      refreshScore({ contractId: created.id }),
    ]);

    revalidatePath('/');
    return { ok: true, contractId: created.id };
  } catch (error) {
    console.error(error);
    await recordAction({
      actionType: 'ContractFailed',
      status: 'Failure',
      message: '契約の作成に失敗しました。',
      hint: '時間をおいて再試行してください。',
    });
    return { ok: false, error: { type: 'System', message: '契約の作成に失敗しました。' } };
  }
}

export async function getContractById(contractId: number): Promise<ContractGetResult> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return {
        ok: false,
        error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' },
      };
    }

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      return { ok: false, error: { type: 'NotFound', message: '契約が見つかりません。' } };
    }

    if (contract.userId !== userContext.userId) {
      return { ok: false, error: { type: 'Conflict', message: '契約の参照権限がありません。' } };
    }

    return {
      ok: true,
      contract: {
        id: contract.id,
        playerId: contract.playerId,
        teamId: contract.teamId,
        userId: contract.userId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        wage: contract.wage,
      },
    };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: '契約の参照に失敗しました。' } };
  }
}
