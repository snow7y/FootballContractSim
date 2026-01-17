export type SimulationConfig = {
  recommendation: {
    wageRatio: { min: number; max: number };
    contractYears: {
      youngProspect: { min: number; max: number };
      veteran: { min: number; max: number };
      standard: { min: number; max: number };
    };
    youngProspectThreshold: { maxAge: number; potentialGap: number };
    veteranThreshold: { minAge: number };
  };
  validation: {
    overvaluationThreshold: number;
    undervaluationThreshold: number;
    mismatchThreshold: { maxOverall: number; maxWage: number };
    longTermRiskThreshold: { maxAge: number; maxYears: number };
  };
  negotiation: {
    expectedWageRatio: number;
    successRateMap: {
      low: { threshold: number; rate: { min: number; max: number } };
      medium: { threshold: { min: number; max: number }; rate: { min: number; max: number } };
      high: { threshold: number; rate: { min: number; max: number } };
    };
  };
  marketValue: {
    baseMultiplier: number;
    ageCorrection: {
      youngStar: { maxAge: number; minOverall: number; multiplier: number };
      veteran: { minAge: number; multiplier: number };
    };
  };
};

const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  recommendation: {
    wageRatio: { min: 0.05, max: 0.15 },
    contractYears: {
      youngProspect: { min: 4, max: 5 },
      veteran: { min: 1, max: 2 },
      standard: { min: 2, max: 4 },
    },
    youngProspectThreshold: { maxAge: 25, potentialGap: 15 },
    veteranThreshold: { minAge: 30 },
  },
  validation: {
    overvaluationThreshold: 0.2,
    undervaluationThreshold: 0.03,
    mismatchThreshold: { maxOverall: 70, maxWage: 20000 },
    longTermRiskThreshold: { maxAge: 18, maxYears: 3 },
  },
  negotiation: {
    expectedWageRatio: 0.08,
    successRateMap: {
      low: { threshold: 0.9, rate: { min: 0.1, max: 0.3 } },
      medium: { threshold: { min: 0.9, max: 1.1 }, rate: { min: 0.7, max: 0.8 } },
      high: { threshold: 1.1, rate: { min: 0.95, max: 1 } },
    },
  },
  marketValue: {
    baseMultiplier: 12,
    ageCorrection: {
      youngStar: { maxAge: 25, minOverall: 85, multiplier: 1.2 },
      veteran: { minAge: 32, multiplier: 0.7 },
    },
  },
};

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  Object.freeze(value);
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  });
  return value;
}

function assertBetweenZeroAndOne(value: number, label: string) {
  if (value < 0 || value > 1 || Number.isNaN(value)) {
    throw new Error(`${label} must be between 0 and 1.`);
  }
}

function assertPositive(value: number, label: string) {
  if (value <= 0 || Number.isNaN(value)) {
    throw new Error(`${label} must be positive.`);
  }
}

function assertNonNegative(value: number, label: string) {
  if (value < 0 || Number.isNaN(value)) {
    throw new Error(`${label} must be zero or greater.`);
  }
}

function assertMinMax(min: number, max: number, label: string) {
  if (min > max) {
    throw new Error(`${label} min must be <= max.`);
  }
}

export function assertValidSimulationConfig(config: SimulationConfig): void {
  assertBetweenZeroAndOne(config.recommendation.wageRatio.min, 'recommendation.wageRatio.min');
  assertBetweenZeroAndOne(config.recommendation.wageRatio.max, 'recommendation.wageRatio.max');
  assertMinMax(config.recommendation.wageRatio.min, config.recommendation.wageRatio.max, 'recommendation.wageRatio');

  assertPositive(config.recommendation.contractYears.youngProspect.min, 'recommendation.contractYears.youngProspect.min');
  assertPositive(config.recommendation.contractYears.youngProspect.max, 'recommendation.contractYears.youngProspect.max');
  assertMinMax(
    config.recommendation.contractYears.youngProspect.min,
    config.recommendation.contractYears.youngProspect.max,
    'recommendation.contractYears.youngProspect'
  );

  assertPositive(config.recommendation.contractYears.veteran.min, 'recommendation.contractYears.veteran.min');
  assertPositive(config.recommendation.contractYears.veteran.max, 'recommendation.contractYears.veteran.max');
  assertMinMax(
    config.recommendation.contractYears.veteran.min,
    config.recommendation.contractYears.veteran.max,
    'recommendation.contractYears.veteran'
  );

  assertPositive(config.recommendation.contractYears.standard.min, 'recommendation.contractYears.standard.min');
  assertPositive(config.recommendation.contractYears.standard.max, 'recommendation.contractYears.standard.max');
  assertMinMax(
    config.recommendation.contractYears.standard.min,
    config.recommendation.contractYears.standard.max,
    'recommendation.contractYears.standard'
  );

  assertBetweenZeroAndOne(config.validation.overvaluationThreshold, 'validation.overvaluationThreshold');
  assertBetweenZeroAndOne(config.validation.undervaluationThreshold, 'validation.undervaluationThreshold');
  assertPositive(config.validation.mismatchThreshold.maxWage, 'validation.mismatchThreshold.maxWage');
  assertPositive(config.validation.mismatchThreshold.maxOverall, 'validation.mismatchThreshold.maxOverall');
  assertPositive(config.validation.longTermRiskThreshold.maxYears, 'validation.longTermRiskThreshold.maxYears');

  assertBetweenZeroAndOne(config.negotiation.expectedWageRatio, 'negotiation.expectedWageRatio');
  assertBetweenZeroAndOne(config.negotiation.successRateMap.low.threshold, 'negotiation.successRateMap.low.threshold');
  assertNonNegative(config.negotiation.successRateMap.medium.threshold.min, 'negotiation.successRateMap.medium.threshold.min');
  assertNonNegative(config.negotiation.successRateMap.medium.threshold.max, 'negotiation.successRateMap.medium.threshold.max');
  assertNonNegative(config.negotiation.successRateMap.high.threshold, 'negotiation.successRateMap.high.threshold');
  assertMinMax(
    config.negotiation.successRateMap.medium.threshold.min,
    config.negotiation.successRateMap.medium.threshold.max,
    'negotiation.successRateMap.medium.threshold'
  );
  assertBetweenZeroAndOne(config.negotiation.successRateMap.low.rate.min, 'negotiation.successRateMap.low.rate.min');
  assertBetweenZeroAndOne(config.negotiation.successRateMap.low.rate.max, 'negotiation.successRateMap.low.rate.max');
  assertMinMax(
    config.negotiation.successRateMap.low.rate.min,
    config.negotiation.successRateMap.low.rate.max,
    'negotiation.successRateMap.low.rate'
  );
  assertBetweenZeroAndOne(config.negotiation.successRateMap.medium.rate.min, 'negotiation.successRateMap.medium.rate.min');
  assertBetweenZeroAndOne(config.negotiation.successRateMap.medium.rate.max, 'negotiation.successRateMap.medium.rate.max');
  assertMinMax(
    config.negotiation.successRateMap.medium.rate.min,
    config.negotiation.successRateMap.medium.rate.max,
    'negotiation.successRateMap.medium.rate'
  );
  assertBetweenZeroAndOne(config.negotiation.successRateMap.high.rate.min, 'negotiation.successRateMap.high.rate.min');
  assertBetweenZeroAndOne(config.negotiation.successRateMap.high.rate.max, 'negotiation.successRateMap.high.rate.max');
  assertMinMax(
    config.negotiation.successRateMap.high.rate.min,
    config.negotiation.successRateMap.high.rate.max,
    'negotiation.successRateMap.high.rate'
  );

  assertPositive(config.marketValue.baseMultiplier, 'marketValue.baseMultiplier');
  assertPositive(config.marketValue.ageCorrection.youngStar.multiplier, 'marketValue.ageCorrection.youngStar.multiplier');
  assertPositive(config.marketValue.ageCorrection.veteran.multiplier, 'marketValue.ageCorrection.veteran.multiplier');
}

export function getSimulationConfig(): SimulationConfig {
  assertValidSimulationConfig(DEFAULT_SIMULATION_CONFIG);
  return deepFreeze({ ...DEFAULT_SIMULATION_CONFIG });
}

export function getDefaultSimulationConfig(): SimulationConfig {
  return getSimulationConfig();
}
