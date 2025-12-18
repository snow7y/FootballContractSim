// サンプル Team データセットと upsert ベースのシード挙動を検証するテスト

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const rootDir = path.join(__dirname, '..');
  const servicePath = path.join(rootDir, 'src', 'seed', 'sampleDataSeedService.js');

  if (!fs.existsSync(servicePath)) {
    throw new Error('SampleDataSeedService module not found at src/seed/sampleDataSeedService.js');
  }

  // 動的 require によって JS モジュールとしてロードする
  // NOTE: 実装では SAMPLE_TEAMS 定義と seedSampleTeams 関数のエクスポートを期待する
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const service = require(servicePath);
  const { SAMPLE_TEAMS, seedSampleTeams } = service;

  if (!Array.isArray(SAMPLE_TEAMS) || SAMPLE_TEAMS.length === 0) {
    throw new Error('SAMPLE_TEAMS must be a non-empty array');
  }

  // サンプル Team の代表性チェック: name/country/foundedYear を持ち、複数国が含まれること
  const countries = new Set();
  for (const team of SAMPLE_TEAMS) {
    if (!team.name || typeof team.name !== 'string') {
      throw new Error('Each sample team must have a string name');
    }
    if (typeof team.country !== 'string') {
      throw new Error('Each sample team must have a string country');
    }
    if (team.foundedYear != null && typeof team.foundedYear !== 'number') {
      throw new Error('foundedYear must be a number or null/undefined');
    }
    countries.add(team.country);
  }
  if (countries.size < 2) {
    throw new Error('SAMPLE_TEAMS should include teams from at least two countries');
  }

  if (typeof seedSampleTeams !== 'function') {
    throw new Error('seedSampleTeams export must be a function');
  }

  const prisma = new PrismaClient();
  try {
    const sampleNames = SAMPLE_TEAMS.map((t) => t.name);

    // 前提クリーンアップ: 対象サンプルチームを削除
    await prisma.team.deleteMany({ where: { name: { in: sampleNames } } });

    // 1回目のシード: 全て作成される想定
    const firstResult = await seedSampleTeams(prisma);
    if (!firstResult || typeof firstResult.teamsCreated !== 'number' || typeof firstResult.teamsUpdated !== 'number') {
      throw new Error('seedSampleTeams must return an object with teamsCreated/teamsUpdated numbers');
    }
    if (firstResult.teamsCreated !== SAMPLE_TEAMS.length) {
      throw new Error('First seed should create exactly SAMPLE_TEAMS.length records');
    }
    if (firstResult.teamsUpdated !== 0) {
      throw new Error('First seed should not update any existing teams');
    }

    const afterFirst = await prisma.team.findMany({ where: { name: { in: sampleNames } } });
    if (afterFirst.length !== SAMPLE_TEAMS.length) {
      throw new Error('After first seed, all sample teams must exist in DB');
    }

    // 2回目のシード: create は 0、update のみになる想定
    const secondResult = await seedSampleTeams(prisma);
    if (secondResult.teamsCreated !== 0) {
      throw new Error('Second seed should not create new teams');
    }
    if (secondResult.teamsUpdated !== SAMPLE_TEAMS.length) {
      throw new Error('Second seed should update all existing sample teams');
    }

    const afterSecond = await prisma.team.findMany({ where: { name: { in: sampleNames } } });
    if (afterSecond.length !== SAMPLE_TEAMS.length) {
      throw new Error('After second seed, sample team count in DB must remain unchanged');
    }

    console.log('sample-data-seed-team-seed.test.js passed (Team sample + upsert behavior).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
