'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './user-actions';
import { recordAction, refreshScore, updatePhase } from './gameplay-state-service';
import {
  calculateRecommendation,
  calculateSuccessRate,
  validateContractTerms,
  type ContractWarning,
  type PlayerSnapshot,
} from './contract-recommendation-service';
import { generatePlayerDialogue } from './player-dialogue-service';
import { getSimulationConfig } from './simulation-config';

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
  | { type: 'NegotiationFailed'; message: string }
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

export type ContractRecommendationResult =
  | {
      ok: true;
      recommendation: ReturnType<typeof calculateRecommendation>;
      player: PlayerSnapshot;
    }
  | { ok: false; error: ContractCreateError };

export type ContractValidationResult =
  | { ok: true; warnings: ContractWarning[] }
  | { ok: false; error: ContractCreateError };

export type NegotiationPreviewResult =
  | { ok: true; preview: ReturnType<typeof calculateSuccessRate> }
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

function calculateContractYears(start: Date, end: Date) {
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(Number((months / 12).toFixed(1)), 0);
}

function extractPlayerSnapshot(player: {
  id: number;
  name: string;
  age: number;
  overall: number;
  potential: number;
  marketValue: number | null;
  wage: number | null;
}): PlayerSnapshot {
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    overall: player.overall,
    potential: player.potential,
    marketValue: player.marketValue,
    wage: player.wage,
  };
}

function parsePlayerIdFromHighlights(deltaHighlights: unknown): number | null {
  if (!Array.isArray(deltaHighlights)) return null;
  const metaEntry = deltaHighlights.find((item) => typeof item === 'string' && item.startsWith('meta:playerId='));
  if (!metaEntry || typeof metaEntry !== 'string') return null;
  const raw = metaEntry.replace('meta:playerId=', '');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getNegotiationFailureCount(userId: number, playerId: number) {
  const recentFailures = await prisma.actionLog.findMany({
    where: { userId, actionType: 'ContractFailed' },
    orderBy: { occurredAt: 'desc' },
    take: 50,
  });

  return recentFailures.filter((failure) => parsePlayerIdFromHighlights(failure.deltaHighlights) === playerId).length;
}

function calculateUpdatedMarketValue(
  player: { age: number; overall: number },
  wage: number
): { nextMarketValue: number; multiplier: number } {
  const config = getSimulationConfig();
  const base = wage * config.marketValue.baseMultiplier;
  let multiplier = 1;
  if (player.age < config.marketValue.ageCorrection.youngStar.maxAge && player.overall >= config.marketValue.ageCorrection.youngStar.minOverall) {
    multiplier = config.marketValue.ageCorrection.youngStar.multiplier;
  } else if (player.age >= config.marketValue.ageCorrection.veteran.minAge) {
    multiplier = config.marketValue.ageCorrection.veteran.multiplier;
  }
  return { nextMarketValue: Math.round(base * multiplier), multiplier };
}

export async function getContractRecommendation(playerId: number): Promise<ContractRecommendationResult> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, name: true, age: true, overall: true, potential: true, marketValue: true, wage: true },
    });

    if (!player) {
      return { ok: false, error: { type: 'NotFound', message: '選手が見つかりません。' } };
    }

    const snapshot = extractPlayerSnapshot(player);
    const recommendation = calculateRecommendation(snapshot);
    return { ok: true, recommendation, player: snapshot };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: '推奨条件の取得に失敗しました。' } };
  }
}

export async function validateContractTermsAction(input: {
  playerId: number;
  wage: number;
  contractYears: number;
}): Promise<ContractValidationResult> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const player = await prisma.player.findUnique({
      where: { id: input.playerId },
      select: { id: true, name: true, age: true, overall: true, potential: true, marketValue: true, wage: true },
    });
    if (!player) {
      return { ok: false, error: { type: 'NotFound', message: '選手が見つかりません。' } };
    }

    const snapshot = extractPlayerSnapshot(player);
    const result = validateContractTerms(snapshot, { wage: input.wage, contractYears: input.contractYears });
    return { ok: true, warnings: result.warnings };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: '契約条件の検証に失敗しました。' } };
  }
}

export async function getNegotiationPreview(input: {
  playerId: number;
  wage: number;
}): Promise<NegotiationPreviewResult> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const player = await prisma.player.findUnique({
      where: { id: input.playerId },
      select: { id: true, name: true, age: true, overall: true, potential: true, marketValue: true, wage: true },
    });
    if (!player) {
      return { ok: false, error: { type: 'NotFound', message: '選手が見つかりません。' } };
    }

    const snapshot = extractPlayerSnapshot(player);
    const preview = calculateSuccessRate(snapshot, input.wage);
    return { ok: true, preview };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: '交渉成功率の取得に失敗しました。' } };
  }
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
      prisma.player.findUnique({
        where: { id: input.playerId },
        select: { id: true, name: true, age: true, overall: true, potential: true, marketValue: true, wage: true },
      }),
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

    const snapshot = extractPlayerSnapshot(player);
    const contractYears = calculateContractYears(validation.start, validation.end);
    const preview = calculateSuccessRate(snapshot, input.wage);
    const failedCount = await getNegotiationFailureCount(userContext.userId, player.id);
    const negotiationSucceeded = Math.random() < preview.successRate;

    if (!negotiationSucceeded) {
      const dialogue = await generatePlayerDialogue({
        player: {
          id: player.id,
          name: player.name,
          age: player.age,
          overall: player.overall,
          potential: player.potential,
        },
        result: 'Failure',
        offeredWage: input.wage,
        expectedWage: preview.expectedWage,
        wageRatio: preview.wageRatio,
        contractYears,
        failureCount: failedCount + 1,
      });

      await recordAction({
        actionType: 'ContractFailed',
        status: 'Failure',
        message: dialogue,
        hint: '提示条件を見直してください。',
        deltaHighlights: [
          `選手: ${player.name}`,
          `提示年俸: ${input.wage}`,
          `契約年数: ${contractYears}年`,
          'meta:negotiation=failed',
          `meta:playerId=${player.id}`,
        ],
      });

      return { ok: false, error: { type: 'NegotiationFailed', message: dialogue } };
    }

    const { nextMarketValue } = calculateUpdatedMarketValue(player, input.wage);
    const previousMarketValue = player.marketValue ?? 0;

    const created = await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          userId: userContext.userId,
          playerId: input.playerId,
          teamId: input.teamId,
          startDate: validation.start,
          endDate: validation.end,
          wage: input.wage,
        },
      });

      await tx.player.update({
        where: { id: player.id },
        data: {
          marketValue: nextMarketValue,
          wage: input.wage,
        },
      });

      return contract;
    });

    const dialogue = await generatePlayerDialogue({
      player: {
        id: player.id,
        name: player.name,
        age: player.age,
        overall: player.overall,
        potential: player.potential,
      },
      result: 'Success',
      offeredWage: input.wage,
      expectedWage: preview.expectedWage,
      wageRatio: preview.wageRatio,
      contractYears,
      failureCount: failedCount,
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
        message: dialogue,
        deltaHighlights: [
          `契約締結: ${player.name} → ${team.name}`,
          `提示年俸: ${input.wage}`,
          `契約年数: ${contractYears}年`,
          `市場価値: ${previousMarketValue} → ${nextMarketValue}`,
          'meta:negotiation=success',
          `meta:playerId=${player.id}`,
        ],
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
