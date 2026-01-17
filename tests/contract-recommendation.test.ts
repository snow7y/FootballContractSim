import { calculateRecommendation } from '../src/app/contracts/contract-recommendation-service';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  const youngStar = {
    id: 1,
    age: 22,
    overall: 70,
    potential: 90,
    marketValue: 20000000,
    wage: 80000,
  };
  const veteran = {
    id: 2,
    age: 32,
    overall: 78,
    potential: 80,
    marketValue: 10000000,
    wage: 60000,
  };
  const standard = {
    id: 3,
    age: 27,
    overall: 75,
    potential: 78,
    marketValue: 12000000,
    wage: 50000,
  };

  const youngRec = calculateRecommendation(youngStar);
  expect(youngRec.contractYears.min >= 4, 'Young prospect should recommend long contract');

  const veteranRec = calculateRecommendation(veteran);
  expect(veteranRec.contractYears.max <= 2, 'Veteran should recommend short contract');

  const standardRec = calculateRecommendation(standard);
  expect(standardRec.contractYears.min >= 2, 'Standard should recommend standard contract');

  console.log('contract-recommendation.test.ts passed');
}

run();
