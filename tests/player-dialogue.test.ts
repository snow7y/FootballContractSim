import { generatePlayerDialogue } from '../src/app/contracts/player-dialogue-service';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function run() {
  const player = { id: 1, name: 'Test', age: 20, overall: 78, potential: 90 };
  const baseContext = {
    player,
    offeredWage: 500000,
    expectedWage: 800000,
    wageRatio: 0.6,
    contractYears: 4,
    failureCount: 1,
  } as const;

  const success = await generatePlayerDialogue({ ...baseContext, result: 'Success' }, { rng: () => 0 });
  expect(success.length > 0, 'Expected success dialogue');

  const failure = await generatePlayerDialogue({ ...baseContext, result: 'Failure' }, { rng: () => 0 });
  expect(failure.length > 0, 'Expected failure dialogue');

  const harsh = await generatePlayerDialogue({ ...baseContext, result: 'Failure', failureCount: 3 }, { rng: () => 0 });
  expect(harsh.length > 0, 'Expected harsh failure dialogue');

  console.log('player-dialogue.test.ts passed');
}

run();
