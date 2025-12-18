// サンプルデータシードの環境ガード挙動を検証するテスト

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('child_process');

async function main() {
  const rootDir = path.join(__dirname, '..');
  const servicePath = path.join(rootDir, 'src', 'seed', 'sampleDataSeedService.js');

  if (!fs.existsSync(servicePath)) {
    throw new Error('SampleDataSeedService module not found at src/seed/sampleDataSeedService.js');
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const service = require(servicePath);
  const { SAMPLE_TEAMS, assertSeedEnvironmentAllowed } = service;

  if (typeof assertSeedEnvironmentAllowed !== 'function') {
    throw new Error('assertSeedEnvironmentAllowed export must be a function');
  }

  // 許可された環境では例外にならないこと
  for (const env of ['development', 'test']) {
    try {
      assertSeedEnvironmentAllowed(env);
    } catch (e) {
      throw new Error(`Environment ${env} should be allowed but caused error: ${e}`);
    }
  }

  // 許可されない環境では例外になること
  for (const env of [undefined, 'production', 'staging']) {
    let threw = false;
    try {
      // @ts-ignore
      assertSeedEnvironmentAllowed(env);
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(`Environment ${env} should not be allowed`);
    }
  }

  // CLI レベルでも禁止環境で DB が変更されないことを確認
  const prisma = new PrismaClient();
  try {
    const sampleNames = (SAMPLE_TEAMS || []).map((t) => t.name);
    await prisma.team.deleteMany({ where: { name: { in: sampleNames } } });

    const cliPath = path.join(rootDir, 'scripts', 'sample-data-seed.js');
    if (!fs.existsSync(cliPath)) {
      throw new Error('CLI entry script not found at scripts/sample-data-seed.js');
    }

    const result = spawnSync('node', [cliPath], {
      cwd: rootDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SEED_ENV: 'production',
      },
      encoding: 'utf8',
    });

    if (result.status === 0) {
      throw new Error('CLI should fail (non-zero exit code) in production environment');
    }

    const after = await prisma.team.findMany({ where: { name: { in: sampleNames } } });
    if (after.length !== 0) {
      throw new Error('Production-like environment must not insert sample teams');
    }

    console.log('sample-data-seed-env-guard.test.js passed (environment guard).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
