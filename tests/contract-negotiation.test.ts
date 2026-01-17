import { calculateSuccessRate } from '../src/app/contracts/contract-recommendation-service';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  const player = {
    id: 1,
    age: 24,
    overall: 80,
    potential: 84,
    marketValue: 10000000,
    wage: 50000,
  };

  const low = calculateSuccessRate(player, 600000); // expected wage: 800000
  expect(low.successRate <= 0.3, 'Low offer should have <= 30% rate');

  const medium = calculateSuccessRate(player, 850000);
  expect(medium.successRate >= 0.7 && medium.successRate <= 0.8, 'Medium offer should be 70-80% rate');

  const high = calculateSuccessRate(player, 1200000);
  expect(high.successRate >= 0.95, 'High offer should be >= 95% rate');

  console.log('contract-negotiation.test.ts passed');
}

run();
