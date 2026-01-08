// サンプルデータシード全体のトランザクション挙動を検証するテスト

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const rootDir = path.join(__dirname, '..');
  const servicePath = path.join(rootDir, 'src', 'seed', 'sampleDataSeedService.js');

  if (!fs.existsSync(servicePath)) {
    throw new Error('SampleDataSeedService module not found at src/seed/sampleDataSeedService.js');
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const service = require(servicePath);
  const {
    SAMPLE_TEAMS,
    SAMPLE_PLAYERS,
    seedSampleData,
    SampleDataSeedError,
  } = service;

  if (typeof seedSampleData !== 'function') {
    throw new Error('seedSampleData export must be a function');
  }

  const prisma = new PrismaClient();
  const teamNames = SAMPLE_TEAMS.map((team) => team.name);
  const playerNames = SAMPLE_PLAYERS.map((player) => player.name);

  try {
    await prisma.player.deleteMany({ where: { name: { in: playerNames } } });
    await prisma.team.deleteMany({ where: { name: { in: teamNames } } });

    const invalidPlayers = [
      {
        ...SAMPLE_PLAYERS[0],
        position: 'NOT_A_POSITION',
      },
    ];

    let threw = false;
    try {
      await seedSampleData(prisma, { players: invalidPlayers });
    } catch (error) {
      threw = true;
      if (!(error instanceof SampleDataSeedError)) {
        throw new Error('seedSampleData should throw SampleDataSeedError for invalid data');
      }
      const result = error.result;
      if (!result || !Array.isArray(result.errors)) {
        throw new Error('SampleDataSeedError must include result.errors array');
      }
      if (result.errors.length === 0) {
        throw new Error('result.errors should contain at least one entry on failure');
      }
      const detail = result.errors[0];
      if (detail.entity !== 'Player') {
        throw new Error('Error detail entity should be "Player" for invalid player data');
      }
      if (detail.identifier !== SAMPLE_PLAYERS[0].name) {
        throw new Error('Error identifier should match the failing player name');
      }
      if (!/NOT_A_POSITION/.test(detail.message)) {
        throw new Error('Error detail message should contain the invalid position value');
      }
      if (
        result.playersCreated !== 0 ||
        result.playersUpdated !== 0 ||
        result.teamsCreated !== 0 ||
        result.teamsUpdated !== 0
      ) {
        throw new Error('Result counts should remain zero when transaction fails');
      }
    }
    if (!threw) {
      throw new Error('seedSampleData should throw when invalid players are provided');
    }

    const afterFailureTeams = await prisma.team.findMany({ where: { name: { in: teamNames } } });
    const afterFailurePlayers = await prisma.player.findMany({ where: { name: { in: playerNames } } });
    if (afterFailureTeams.length !== 0 || afterFailurePlayers.length !== 0) {
      throw new Error('Failed transaction must roll back both team and player inserts');
    }

    // 正常系: すべてのサンプルデータが投入され、結果サマリが正しいことを確認
    const successResult = await seedSampleData(prisma);
    if (
      !successResult ||
      successResult.teamsCreated !== SAMPLE_TEAMS.length ||
      successResult.playersCreated !== SAMPLE_PLAYERS.length ||
      successResult.teamsUpdated !== 0 ||
      successResult.playersUpdated !== 0
    ) {
      throw new Error('First successful seed should create all teams and players with zero updates');
    }
    if (!Array.isArray(successResult.errors) || successResult.errors.length !== 0) {
      throw new Error('Successful seed result should contain an empty errors array');
    }

    const secondResult = await seedSampleData(prisma);
    if (
      secondResult.teamsCreated !== 0 ||
      secondResult.playersCreated !== 0 ||
      secondResult.teamsUpdated !== SAMPLE_TEAMS.length ||
      secondResult.playersUpdated !== SAMPLE_PLAYERS.length
    ) {
      throw new Error('Second seed should update all teams and players without creating new rows');
    }
    if (!Array.isArray(secondResult.errors) || secondResult.errors.length !== 0) {
      throw new Error('Repeat seed result should contain an empty errors array');
    }

    console.log('sample-data-seed-transaction.test.js passed (transactional seed behavior).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
