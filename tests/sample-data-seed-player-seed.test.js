// サンプル Player データセットの upsert シード挙動を検証するテスト

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
  const { SAMPLE_PLAYERS, seedSamplePlayers, seedSampleTeams } = service;

  if (!Array.isArray(SAMPLE_PLAYERS) || SAMPLE_PLAYERS.length === 0) {
    throw new Error('SAMPLE_PLAYERS must be a non-empty array');
  }
  if (typeof seedSamplePlayers !== 'function') {
    throw new Error('seedSamplePlayers export must be a function');
  }
  if (typeof seedSampleTeams !== 'function') {
    throw new Error('seedSampleTeams export must be a function');
  }

  const prisma = new PrismaClient();
  const sampleNames = SAMPLE_PLAYERS.map((player) => player.name);

  try {
    // 対象サンプルプレイヤーとチームをクリーンアップ
    await prisma.player.deleteMany({ where: { name: { in: sampleNames } } });
    await prisma.team.deleteMany({ where: { name: { in: (service.SAMPLE_TEAMS || []).map((t) => t.name) } } });

    // 先にサンプルチームを投入し、currentClub 参照が有効であることを保証
    await seedSampleTeams(prisma);

    // 1回目のシード: 全て作成される想定
    const firstResult = await seedSamplePlayers(prisma);
    if (
      !firstResult ||
      typeof firstResult.playersCreated !== 'number' ||
      typeof firstResult.playersUpdated !== 'number'
    ) {
      throw new Error('seedSamplePlayers must return an object with playersCreated/playersUpdated numbers');
    }
    if (firstResult.playersCreated !== SAMPLE_PLAYERS.length) {
      throw new Error('First player seed should create exactly SAMPLE_PLAYERS.length records');
    }
    if (firstResult.playersUpdated !== 0) {
      throw new Error('First player seed should not update any existing players');
    }

    const afterFirst = await prisma.player.findMany({ where: { name: { in: sampleNames } } });
    if (afterFirst.length !== SAMPLE_PLAYERS.length) {
      throw new Error('After first seed, all sample players must exist in DB');
    }

    // second run should update all but create none
    const secondResult = await seedSamplePlayers(prisma);
    if (secondResult.playersCreated !== 0) {
      throw new Error('Second player seed should not create new players');
    }
    if (secondResult.playersUpdated !== SAMPLE_PLAYERS.length) {
      throw new Error('Second player seed should update all existing sample players');
    }

    const afterSecond = await prisma.player.findMany({ where: { name: { in: sampleNames } } });
    if (afterSecond.length !== SAMPLE_PLAYERS.length) {
      throw new Error('After second seed, sample player count in DB must remain unchanged');
    }

    console.log('sample-data-seed-player-seed.test.js passed (Player sample upsert behavior).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
