// サンプルデータシードの CLI 実行による統合挙動を検証するテスト

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

    const runCli = () =>
      spawnSync('node', ['scripts/sample-data-seed.js'], {
        cwd: rootDir,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          SEED_ENV: 'development',
        },
        encoding: 'utf8',
      });

    const firstRun = runCli();
    if (firstRun.status !== 0) {
      throw new Error(
        `First CLI execution should succeed with exit code 0 but exited with ${firstRun.status}`,
      );
    }

    const teamsAfterFirst = await prisma.team.findMany({ where: { name: { in: teamNames } } });
    const playersAfterFirst = await prisma.player.findMany({ where: { name: { in: playerNames } } });
    if (teamsAfterFirst.length !== expectedTeamCount) {
      throw new Error('After first run, all sample teams must exist in DB');
    }
    if (playersAfterFirst.length !== expectedPlayerCount) {
      throw new Error('After first run, all sample players must exist in DB');
    }

    const secondRun = runCli();
    if (secondRun.status !== 0) {
      throw new Error(
        `Second CLI execution should also exit with 0 but exited with ${secondRun.status}`,
      );
    }

    const teamsAfterSecond = await prisma.team.findMany({ where: { name: { in: teamNames } } });
    const playersAfterSecond = await prisma.player.findMany({ where: { name: { in: playerNames } } });
    if (teamsAfterSecond.length !== expectedTeamCount) {
      throw new Error('After second run, sample team count must remain unchanged');
    }
    if (playersAfterSecond.length !== expectedPlayerCount) {
      throw new Error('After second run, sample player count must remain unchanged');
    }

    console.log('sample-data-seed-integration.test.js passed (CLI integration).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
