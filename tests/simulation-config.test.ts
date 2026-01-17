import { assertValidSimulationConfig, getSimulationConfig } from '../src/app/contracts/simulation-config';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  const config = getSimulationConfig();
  assertValidSimulationConfig(config);

  expect(config.recommendation.wageRatio.min <= config.recommendation.wageRatio.max, 'Wage ratio min/max invalid');
  expect(config.negotiation.successRateMap.low.rate.min <= config.negotiation.successRateMap.low.rate.max, 'Low rate range invalid');

  let threw = false;
  try {
    assertValidSimulationConfig({
      ...config,
      recommendation: {
        ...config.recommendation,
        wageRatio: { min: 0.9, max: 0.1 },
      },
    });
  } catch (error) {
    threw = true;
  }

  expect(threw, 'Expected invalid config to throw');
  console.log('simulation-config.test.ts passed');
}

run();
