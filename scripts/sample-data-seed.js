// サンプルデータシード CLI エントリポイント
// 現時点では Team サンプルデータのみを対象とし、将来的に Player などへ拡張可能な構成とする。

const { PrismaClient } = require('@prisma/client');
const {
  SAMPLE_PLAYERS,
  seedSampleData,
  assertSeedEnvironmentAllowed,
  SampleDataSeedError,
  createEmptySeedResult,
} = require('../src/seed/sampleDataSeedService.js');

async function main() {
  const env = process.env.SEED_ENV || process.env.NODE_ENV || 'development';

  try {
    // 許可されていない環境では早期に中断し、DB には一切書き込まない
    assertSeedEnvironmentAllowed(env);
  } catch (error) {
    console.error('Sample data seed is not allowed in this environment:', error.message || error);
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  const startTime = new Date();
  logSeedStart(startTime, env);
  const seedOptions = buildSeedOptionsFromEnv();

  /** @type {import('../src/seed/sampleDataSeedService.js').SampleDataSeedResult | undefined} */
  let lastResult;

  try {
    lastResult = await seedSampleData(prisma, seedOptions);
    logSeedFinish('success', startTime, lastResult);
  } catch (error) {
    if (error instanceof SampleDataSeedError) {
      lastResult = error.result || lastResult;
      logSeedFinish('failed', startTime, lastResult || createEmptySeedResult());
      console.error('Sample data seed failed with aggregated errors:');
      const result = error.result || {};
      console.error(
        'Result summary:',
        `teams(created=${result.teamsCreated ?? 0}, updated=${result.teamsUpdated ?? 0}),`,
        `players(created=${result.playersCreated ?? 0}, updated=${result.playersUpdated ?? 0})`,
      );
      (result.errors || []).forEach((detail) => {
        console.error(` - ${detail.entity}(${detail.identifier}): ${detail.message}`);
      });
      process.exitCode = 2;
    } else {
      logSeedFinish('failed', startTime, lastResult || createEmptySeedResult());
      console.error('Sample data seed failed:', error);
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * @param {Date} startTime
 * @param {string} environment
 */
function logSeedStart(startTime, environment) {
  console.log(
    `[${startTime.toISOString()}] Sample data seed started (environment=${environment})`,
  );
}

/**
 * @param {'success' | 'failed'} status
 * @param {Date} startTime
 * @param {import('../src/seed/sampleDataSeedService.js').SampleDataSeedResult | undefined} result
 */
function logSeedFinish(status, startTime, result) {
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  const summary = result || createEmptySeedResult();
  console.log(
    `[${endTime.toISOString()}] Sample data seed finished in ${duration}ms (status=${status}) - ` +
      `teams(created=${summary.teamsCreated}, updated=${summary.teamsUpdated}) ` +
      `players(created=${summary.playersCreated}, updated=${summary.playersUpdated})`,
  );
}

function buildSeedOptionsFromEnv() {
  const mode = process.env.SEED_FAULT_MODE;
  if (mode === 'player-invalid-position') {
    const invalidPlayers = SAMPLE_PLAYERS.map((player, index) =>
      index === 0
        ? {
            ...player,
            position: 'NOT_A_POSITION',
          }
        : player,
    );
    return { players: invalidPlayers };
  }
  return undefined;
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
};
