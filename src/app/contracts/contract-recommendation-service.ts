import { getSimulationConfig, type SimulationConfig } from './simulation-config';

export type PlayerSnapshot = {
  id: number;
  name?: string | null;
  age: number;
  overall: number;
  potential: number;
  marketValue: number | null;
  wage: number | null;
};

export type RecommendedTerms = {
  wageRange: { min: number; max: number };
  contractYears: { min: number; max: number };
  rationale: string;
};

export type ContractWarningType = 'Overvalued' | 'Undervalued' | 'LongTermRisk' | 'Mismatch';

export type ContractWarning = {
  type: ContractWarningType;
  message: string;
  severity: 'warning';
};

export type ContractValidationResult = {
  warnings: ContractWarning[];
  hasWarnings: boolean;
};

export type SuccessRateResult = {
  successRate: number;
  expectedWage: number;
  offeredWage: number;
  wageRatio: number;
  rateBand: 'low' | 'medium' | 'high';
};

function normalizeMarketValue(value: number | null) {
  return Math.max(value ?? 0, 0);
}

function resolveRecommendationRationale(player: PlayerSnapshot, config: SimulationConfig) {
  const potentialGap = player.potential - player.overall;
  if (player.age < config.recommendation.youngProspectThreshold.maxAge && potentialGap >= config.recommendation.youngProspectThreshold.potentialGap) {
    return '若手有望株のため長期契約を推奨します。';
  }
  if (player.age >= config.recommendation.veteranThreshold.minAge) {
    return 'ベテラン選手のため短期契約を推奨します。';
  }
  return '平均的な年齢帯のため標準的な契約期間を推奨します。';
}

export function calculateRecommendation(player: PlayerSnapshot, config = getSimulationConfig()): RecommendedTerms {
  const marketValue = normalizeMarketValue(player.marketValue);
  const wageMin = Math.round(marketValue * config.recommendation.wageRatio.min);
  const wageMax = Math.round(marketValue * config.recommendation.wageRatio.max);

  const potentialGap = player.potential - player.overall;
  let contractYears = config.recommendation.contractYears.standard;
  if (player.age < config.recommendation.youngProspectThreshold.maxAge && potentialGap >= config.recommendation.youngProspectThreshold.potentialGap) {
    contractYears = config.recommendation.contractYears.youngProspect;
  } else if (player.age >= config.recommendation.veteranThreshold.minAge) {
    contractYears = config.recommendation.contractYears.veteran;
  }

  return {
    wageRange: { min: wageMin, max: wageMax },
    contractYears: { min: contractYears.min, max: contractYears.max },
    rationale: resolveRecommendationRationale(player, config),
  };
}

export function validateContractTerms(
  player: PlayerSnapshot,
  input: { wage: number; contractYears: number },
  config = getSimulationConfig()
): ContractValidationResult {
  const warnings: ContractWarning[] = [];
  const marketValue = normalizeMarketValue(player.marketValue);

  if (marketValue > 0) {
    const overvaluedThreshold = marketValue * config.validation.overvaluationThreshold;
    if (input.wage > overvaluedThreshold) {
      warnings.push({
        type: 'Overvalued',
        message: '提示年俸が市場価値の20%を超えています（過剰評価）。',
        severity: 'warning',
      });
    }

    const undervaluedThreshold = marketValue * config.validation.undervaluationThreshold;
    if (input.wage < undervaluedThreshold) {
      warnings.push({
        type: 'Undervalued',
        message: '提示年俸が市場価値の3%未満です（低評価）。',
        severity: 'warning',
      });
    }
  }

  if (player.age < config.validation.longTermRiskThreshold.maxAge && input.contractYears > config.validation.longTermRiskThreshold.maxYears) {
    warnings.push({
      type: 'LongTermRisk',
      message: '18歳未満の選手への長期契約はリスクがあります。',
      severity: 'warning',
    });
  }

  if (player.overall < config.validation.mismatchThreshold.maxOverall && input.wage > config.validation.mismatchThreshold.maxWage) {
    warnings.push({
      type: 'Mismatch',
      message: '能力値と報酬水準がミスマッチです。',
      severity: 'warning',
    });
  }

  return { warnings, hasWarnings: warnings.length > 0 };
}

function resolveRateBand(wageRatio: number, config: SimulationConfig) {
  if (wageRatio < config.negotiation.successRateMap.low.threshold) return 'low';
  if (wageRatio >= config.negotiation.successRateMap.high.threshold) return 'high';
  return 'medium';
}

function resolveRateRange(band: 'low' | 'medium' | 'high', config: SimulationConfig) {
  if (band === 'low') return config.negotiation.successRateMap.low.rate;
  if (band === 'high') return config.negotiation.successRateMap.high.rate;
  return config.negotiation.successRateMap.medium.rate;
}

export function calculateSuccessRate(
  player: PlayerSnapshot,
  offeredWage: number,
  config = getSimulationConfig()
): SuccessRateResult {
  const marketValue = normalizeMarketValue(player.marketValue);
  const expectedWage = Math.round(marketValue * config.negotiation.expectedWageRatio);
  const wageRatio = expectedWage > 0 ? offeredWage / expectedWage : 0;
  const rateBand = resolveRateBand(wageRatio, config);
  const rateRange = resolveRateRange(rateBand, config);
  const successRate = Number(((rateRange.min + rateRange.max) / 2).toFixed(2));

  return {
    successRate,
    expectedWage,
    offeredWage,
    wageRatio,
    rateBand,
  };
}
