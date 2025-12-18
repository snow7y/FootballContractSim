// サンプルデータシード CLI エントリポイント
// 現時点では Team サンプルデータのみを対象とし、将来的に Player などへ拡張可能な構成とする。

const { PrismaClient } = require('@prisma/client');
const { seedSampleTeams, assertSeedEnvironmentAllowed } = require('../src/seed/sampleDataSeedService.js');

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

  try {
    const { teamsCreated, teamsUpdated } = await seedSampleTeams(prisma);
    // シンプルなサマリ出力（詳細な観測性は後続タスクで拡張）
    console.log(
      `Sample Team seed completed: created=${teamsCreated}, updated=${teamsUpdated}`,
    );
  } catch (error) {
    console.error('Sample data seed failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
};
