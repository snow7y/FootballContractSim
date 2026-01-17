import { validateContractTerms } from '../src/app/contracts/contract-recommendation-service';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  const player = {
    id: 1,
    age: 17,
    overall: 65,
    potential: 75,
    marketValue: 10000000,
    wage: 5000,
  };

  const result = validateContractTerms(player, { wage: 3000000, contractYears: 4 });
  const warningTypes = result.warnings.map((warning) => warning.type);

  expect(warningTypes.includes('Overvalued'), 'Expected overvalued warning');
  expect(warningTypes.includes('LongTermRisk'), 'Expected long term risk warning');
  expect(warningTypes.includes('Mismatch'), 'Expected mismatch warning');

  const lowResult = validateContractTerms(player, { wage: 100000, contractYears: 1 });
  expect(lowResult.warnings.some((warning) => warning.type === 'Undervalued'), 'Expected undervalued warning');

  console.log('contract-validation.test.ts passed');
}

run();
