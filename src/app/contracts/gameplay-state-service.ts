'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './user-actions';

export type PhaseStatus = 'NotStarted' | 'InProgress' | 'Completed';

export type BasePanelProps = {
  title: string;
  description?: string;
  emptyState?: { title: string; detail: string; actionLabel?: string; actionHref?: string };
};

export type PhaseProgressState = {
  phaseId: string;
  phaseLabel: string;
  stepIndex: number;
  totalSteps: number;
  status: PhaseStatus;
  updatedAt: string;
};

export type GoalStatus = 'Active' | 'Completed' | 'Expired' | 'Disabled';

export type GoalState = {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  reason?: string;
  progressLabel?: string;
  updatedAt: string;
};

export type ActionResultSummary = {
  id: string;
  actionType: 'ContractCreated' | 'UserSelected' | 'UserCreated' | 'ContractFailed' | 'PhaseUpdated';
  status: 'Success' | 'Failure' | 'Pending';
  message: string;
  hint?: string;
  deltaHighlights?: string[];
  occurredAt: string;
};

export type ScoreMetric = {
  id: string;
  label: string;
  value: number;
  maxValue?: number;
  delta?: number;
  description?: string;
  missingReason?: string;
};

export type ScoreSnapshot = {
  totalScore: number;
  metrics: ScoreMetric[];
  calculatedAt: string;
};

export type GameplayDashboardData = {
  phase: PhaseProgressState | null;
  goals: GoalState[];
  recentActions: ActionResultSummary[];
  score: ScoreSnapshot | null;
  summary: {
    playerCount: number;
    teamCount: number;
    activeGoals: number;
    nextActionLabel: string;
  };
};

export type GameplayStateError =
  | { type: 'UserContextMissing'; message: string }
  | { type: 'Validation'; message: string; fields: string[] }
  | { type: 'System'; message: string };

export type GameplayStateResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GameplayStateError };

const DEFAULT_GOALS = [
  {
    title: '最初の契約を締結する',
    description: '選手とクラブを選び、契約を1件確定する。',
    status: 'Active' as const,
    progressLabel: '0/1 完了',
  },
  {
    title: 'クラブの選択肢を増やす',
    description: '3クラブ以上の登録を目指す。',
    status: 'Active' as const,
    progressLabel: '0/3 完了',
  },
];

const PHASE_LABELS: Record<string, string> = {
  contract: '契約フェーズ',
  overview: 'クラブ状況フェーズ',
};

function formatDate(date: Date) {
  return date.toISOString();
}

function resolvePhaseLabel(phaseId: string) {
  return PHASE_LABELS[phaseId] ?? `フェーズ: ${phaseId}`;
}

type StoredGoal = {
  id: number;
  title: string;
  description: string | null;
  status: GoalStatus;
  reason: string | null;
  progressLabel: string | null;
  updatedAt: Date;
};

type StoredScoreMetric = {
  id: number;
  label: string;
  value: number;
  maxValue: number | null;
  delta: number | null;
  description: string | null;
  missingReason: string | null;
};

type StoredScoreSnapshot = {
  totalScore: number;
  calculatedAt: Date;
  metrics: StoredScoreMetric[];
};

async function ensureDefaultGoals(userId: number): Promise<StoredGoal[]> {
  const existing = await prisma.goal.findMany({ where: { userId } });
  if (existing.length) return existing;

  await prisma.goal.createMany({
    data: DEFAULT_GOALS.map((goal) => ({
      userId,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      progressLabel: goal.progressLabel,
    })),
  });

  return prisma.goal.findMany({ where: { userId } });
}

function mapGoal(goal: StoredGoal): GoalState {
  return {
    id: String(goal.id),
    title: goal.title,
    description: goal.description ?? undefined,
    status: goal.status,
    reason: goal.reason ?? undefined,
    progressLabel: goal.progressLabel ?? undefined,
    updatedAt: formatDate(goal.updatedAt),
  };
}

function mapAction(log: { id: number; actionType: ActionResultSummary['actionType']; status: ActionResultSummary['status']; message: string; hint: string | null; deltaHighlights: any; occurredAt: Date; }): ActionResultSummary {
  return {
    id: String(log.id),
    actionType: log.actionType,
    status: log.status,
    message: log.message,
    hint: log.hint ?? undefined,
    deltaHighlights: Array.isArray(log.deltaHighlights) ? log.deltaHighlights : undefined,
    occurredAt: formatDate(log.occurredAt),
  };
}

function mapScore(snapshot: { totalScore: number; calculatedAt: Date; metrics: Array<{ id: number; label: string; value: number; maxValue: number | null; delta: number | null; description: string | null; missingReason: string | null; }>; }): ScoreSnapshot {
  return {
    totalScore: snapshot.totalScore,
    calculatedAt: formatDate(snapshot.calculatedAt),
    metrics: snapshot.metrics.map((metric) => ({
      id: String(metric.id),
      label: metric.label,
      value: metric.value,
      maxValue: metric.maxValue ?? undefined,
      delta: metric.delta ?? undefined,
      description: metric.description ?? undefined,
      missingReason: metric.missingReason ?? undefined,
    })),
  };
}

export async function getDashboardData(): Promise<GameplayStateResult<GameplayDashboardData>> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const [phase, goals, recentActions, scoreSnapshot, playerCount, teamCount] = await Promise.all([
      prisma.gameplayPhaseState.findFirst({
        where: { userId: userContext.userId },
        orderBy: { updatedAt: 'desc' },
      }),
      ensureDefaultGoals(userContext.userId),
      prisma.actionLog.findMany({
        where: { userId: userContext.userId },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
      prisma.scoreSnapshot.findFirst({
        where: { userId: userContext.userId },
        orderBy: { calculatedAt: 'desc' },
        include: { metrics: true },
      }),
      prisma.player.count(),
      prisma.team.count(),
    ]);

    const activeGoals = goals.filter((goal: StoredGoal) => goal.status === 'Active').length;

    const nextActionLabel = phase
      ? phase.status === 'Completed'
        ? '次のフェーズへ進む'
        : '契約を進める'
      : '契約を開始する';

    return {
      ok: true,
      data: {
        phase: phase
          ? {
              phaseId: phase.phaseId,
              phaseLabel: phase.phaseLabel,
              stepIndex: phase.stepIndex,
              totalSteps: phase.totalSteps,
              status: phase.status,
              updatedAt: formatDate(phase.updatedAt),
            }
          : null,
        goals: goals.map(mapGoal),
        recentActions: recentActions.map(mapAction),
        score: scoreSnapshot ? mapScore(scoreSnapshot) : null,
        summary: {
          playerCount,
          teamCount,
          activeGoals,
          nextActionLabel,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'ダッシュボードデータの取得に失敗しました。' } };
  }
}

export async function updatePhase(input: {
  phaseId: string;
  stepIndex: number;
  totalSteps: number;
  status: PhaseStatus;
}): Promise<GameplayStateResult<PhaseProgressState>> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const fields: string[] = [];
    if (typeof input.stepIndex !== 'number' || input.stepIndex < 0) fields.push('stepIndex');
    if (typeof input.totalSteps !== 'number' || input.totalSteps <= 0) fields.push('totalSteps');
    if (input.totalSteps > 0 && input.stepIndex >= input.totalSteps) fields.push('stepIndex');

    if (fields.length) {
      return { ok: false, error: { type: 'Validation', message: '進行状態が不正です。', fields } };
    }

    const phase = await prisma.gameplayPhaseState.upsert({
      where: {
        userId_phaseId: {
          userId: userContext.userId,
          phaseId: input.phaseId,
        },
      },
      update: {
        stepIndex: input.stepIndex,
        totalSteps: input.totalSteps,
        status: input.status,
        phaseLabel: resolvePhaseLabel(input.phaseId),
      },
      create: {
        userId: userContext.userId,
        phaseId: input.phaseId,
        phaseLabel: resolvePhaseLabel(input.phaseId),
        stepIndex: input.stepIndex,
        totalSteps: input.totalSteps,
        status: input.status,
      },
    });

    await prisma.actionLog.create({
      data: {
        userId: userContext.userId,
        actionType: 'PhaseUpdated',
        status: 'Success',
        message: `フェーズ更新: ${phase.phaseLabel}`,
      },
    });

    return {
      ok: true,
      data: {
        phaseId: phase.phaseId,
        phaseLabel: phase.phaseLabel,
        stepIndex: phase.stepIndex,
        totalSteps: phase.totalSteps,
        status: phase.status,
        updatedAt: formatDate(phase.updatedAt),
      },
    };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'フェーズ更新に失敗しました。' } };
  }
}

export async function recordAction(input: {
  actionType: ActionResultSummary['actionType'];
  status: ActionResultSummary['status'];
  message: string;
  hint?: string;
  deltaHighlights?: string[];
}): Promise<GameplayStateResult<ActionResultSummary>> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const log = await prisma.actionLog.create({
      data: {
        userId: userContext.userId,
        actionType: input.actionType,
        status: input.status,
        message: input.message,
        hint: input.hint,
        deltaHighlights: input.deltaHighlights,
      },
    });

    return { ok: true, data: mapAction(log) };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'アクションの記録に失敗しました。' } };
  }
}

function monthsBetween(startDate: Date, endDate: Date) {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  return Math.max(months, 0);
}

export async function refreshScore(input: { contractId?: number }): Promise<GameplayStateResult<ScoreSnapshot>> {
  try {
    const userContext = await getCurrentUser();
    if (!userContext.ok) {
      return { ok: false, error: { type: 'UserContextMissing', message: '現在のユーザーが未選択です。' } };
    }

    const contract = input.contractId
      ? await prisma.contract.findUnique({ where: { id: input.contractId } })
      : await prisma.contract.findFirst({
          where: { userId: userContext.userId },
          orderBy: { createdAt: 'desc' },
        });

    const previousSnapshot = (await prisma.scoreSnapshot.findFirst({
      where: { userId: userContext.userId },
      orderBy: { calculatedAt: 'desc' },
      include: { metrics: true },
    })) as StoredScoreSnapshot | null;

    let metrics: Array<{
      label: string;
      value: number;
      maxValue?: number;
      delta?: number | null;
      description?: string;
      missingReason?: string;
    }> = [];

    if (!contract) {
      metrics = [
        {
          label: '契約データ',
          value: 0,
          maxValue: 100,
          description: '契約が存在しないためスコアを算出できません。',
          missingReason: '契約がまだ登録されていません。',
        },
      ];
    } else {
      const termMonths = monthsBetween(contract.startDate, contract.endDate);
      const termScore = Math.min(termMonths * 2, 100);
      const wageScore = Math.min(Math.round(contract.wage / 100), 100);

      metrics = [
        {
          label: '契約期間',
          value: termScore,
          maxValue: 100,
          description: '契約期間の長さに応じた評価。',
        },
        {
          label: '報酬水準',
          value: wageScore,
          maxValue: 100,
          description: '報酬の水準を評価。',
        },
      ];
    }

    if (previousSnapshot) {
      metrics = metrics.map((metric) => {
        const previous = previousSnapshot.metrics.find((item: StoredScoreMetric) => item.label === metric.label);
        if (!previous) return metric;
        return { ...metric, delta: metric.value - previous.value };
      });
    }

    const totalScore = metrics.reduce((sum, metric) => sum + metric.value, 0);

    const created = await prisma.scoreSnapshot.create({
      data: {
        userId: userContext.userId,
        contractId: contract?.id ?? null,
        totalScore,
        metrics: {
          create: metrics.map((metric) => ({
            label: metric.label,
            value: metric.value,
            maxValue: metric.maxValue,
            delta: metric.delta ?? null,
            description: metric.description,
            missingReason: metric.missingReason,
          })),
        },
      },
      include: { metrics: true },
    });

    return { ok: true, data: mapScore(created) };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'スコア更新に失敗しました。' } };
  }
}
