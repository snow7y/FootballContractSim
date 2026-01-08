// sample-data-seed CLI の出力と終了コード、ログ挙動を検証するテスト

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const rootDir = path.join(__dirname, '..');
  const cliPath = path.join(rootDir, 'scripts', 'sample-data-seed.js');
  if (!fs.existsSync(cliPath)) {
    throw new Error('CLI entry script not found at scripts/sample-data-seed.js');
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const service = require(path.join(rootDir, 'src', 'seed', 'sampleDataSeedService.js'));
  const teamNames = (service.SAMPLE_TEAMS || []).map((team) => team.name);
  const playerNames = (service.SAMPLE_PLAYERS || []).map((player) => player.name);
  const expectedTeamCount = teamNames.length;
  const expectedPlayerCount = playerNames.length;

  const prisma = new PrismaClient();
  try {
    await prisma.player.deleteMany({ where: { name: { in: playerNames } } });
    await prisma.team.deleteMany({ where: { name: { in: teamNames } } });

    const successRun = spawnSync('node', ['scripts/sample-data-seed.js'], {
      cwd: rootDir,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        SEED_ENV: 'development',
      },
      encoding: 'utf8',
    });

    if (successRun.status !== 0) {
      throw new Error(`CLI should exit with code 0 on success but exited with ${successRun.status}`);
    }

    if (!/Sample data seed started \(environment=development\)/.test(successRun.stdout)) {
      throw new Error('Success run stdout must include start log with environment');
    }
      const summaryPattern = new RegExp(
        `teams\\(created=${expectedTeamCount}, updated=0\\)[\\s\\S]*players\\(created=${expectedPlayerCount}, updated=0\\)`,
      );
    if (!summaryPattern.test(successRun.stdout)) {
      throw new Error('Success run stdout must include teams/players summary');
    }
    if (!/Sample data seed finished in \d+ms \(status=success\)/.test(successRun.stdout)) {
      throw new Error('Success run stdout must include finished log with success status');
    }

    // 失敗（部分成功）シナリオ: テスト専用の fault モードで強制的に Player データを不正化
    const failureRun = spawnSync('node', ['scripts/sample-data-seed.js'], {
      cwd: rootDir,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        SEED_ENV: 'development',
        SEED_FAULT_MODE: 'player-invalid-position',
      },
      encoding: 'utf8',
    });

    if (failureRun.status !== 2) {
      throw new Error(`CLI should exit with code 2 on aggregated errors but exited with ${failureRun.status}`);
    }
    if (!/Sample data seed started \(environment=development\)/.test(failureRun.stdout)) {
      throw new Error('Failure run stdout must include start log');
    }
    if (!/Sample data seed finished in \d+ms \(status=failed\)/.test(failureRun.stdout)) {
      throw new Error('Failure run stdout must include finished log with failed status');
    }
    if (!/Sample data seed failed with aggregated errors/.test(failureRun.stderr)) {
      throw new Error('Failure run stderr must describe aggregated errors');
    }
    if (!failureRun.stderr.includes('Player(Taro Keeper)')) {
      throw new Error('Failure run stderr must include failing player identifier');
    }

    const teamCountAfterFailure = await prisma.team.count({ where: { name: { in: teamNames } } });
    const playerCountAfterFailure = await prisma.player.count({ where: { name: { in: playerNames } } });
    if (teamCountAfterFailure !== expectedTeamCount || playerCountAfterFailure !== expectedPlayerCount) {
      throw new Error('Failure run should not change seeded dataset due to rollback');
    }

    console.log('sample-data-seed-cli-output.test.js passed (CLI logging & exit codes).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
