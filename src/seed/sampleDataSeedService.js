// SampleDataSeedService: Team/Player 向けサンプルデータとシード関連ユーティリティ

const SAMPLE_TEAMS = [
  {
    name: 'Sample FC Tokyo',
    country: 'Japan',
    foundedYear: 1999,
  },
  {
    name: 'Sample United',
    country: 'England',
    foundedYear: 1902,
  },
  {
    name: 'Sample Madrid',
    country: 'Spain',
    foundedYear: 1900,
  },
];

// Player サンプルデータセット定義
// Player モデルの主な属性 (name, position, age, overall, potential, currentClub など) を
// 代表的な値でカバーし、複数ポジション・複数クラブにまたがる構成とする。

const SAMPLE_PLAYERS = [
  {
    name: 'Taro Keeper',
    position: 'GK',
    age: 28,
    nationality: 'Japan',
    overall: 82,
    potential: 84,
    currentClub: 'Sample FC Tokyo',
    contractUntil: null,
    marketValue: 12000000,
    wage: 80000,
  },
  {
    name: 'Kenji Center Back',
    position: 'CB',
    age: 26,
    nationality: 'Japan',
    overall: 79,
    potential: 82,
    currentClub: 'Sample FC Tokyo',
    contractUntil: null,
    marketValue: 9000000,
    wage: 60000,
  },
  {
    name: 'John Playmaker',
    position: 'CM',
    age: 24,
    nationality: 'England',
    overall: 85,
    potential: 88,
    currentClub: 'Sample United',
    contractUntil: null,
    marketValue: 20000000,
    wage: 120000,
  },
  {
    name: 'Luis Winger',
    position: 'LW',
    age: 23,
    nationality: 'Spain',
    overall: 83,
    potential: 87,
    currentClub: 'Sample Madrid',
    contractUntil: null,
    marketValue: 18000000,
    wage: 110000,
  },
  {
    name: 'Alex Striker',
    position: 'ST',
    age: 27,
    nationality: 'England',
    overall: 86,
    potential: 88,
    currentClub: 'Sample United',
    contractUntil: null,
    marketValue: 25000000,
    wage: 150000,
  },
];

/**
 * Team.name を論理キーとみなし、既存レコードがあれば更新、なければ作成する。
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<{ teamsCreated: number; teamsUpdated: number }>} 結果サマリ
 */
async function seedSampleTeams(prisma) {
  const sampleTeams = SAMPLE_TEAMS;
  let teamsCreated = 0;
  let teamsUpdated = 0;

  for (const team of sampleTeams) {
    // name をキーとした論理的一意性に基づく upsert 相当の挙動
    const existing = await prisma.team.findFirst({ where: { name: team.name } });

    if (existing) {
      await prisma.team.update({
        where: { id: existing.id },
        data: {
          country: team.country,
          foundedYear: team.foundedYear ?? null,
        },
      });
      teamsUpdated += 1;
    } else {
      await prisma.team.create({
        data: {
          name: team.name,
          country: team.country,
          foundedYear: team.foundedYear ?? null,
        },
      });
      teamsCreated += 1;
    }
  }

  return { teamsCreated, teamsUpdated };
}

/**
 * サンプルデータシードが許可される環境かを検証する。
 * 許可されていない場合は Error を投げ、呼び出し側で処理を中断させる。
 *
 * @param {string | undefined} environment
 */
function assertSeedEnvironmentAllowed(environment) {
  const allowed = new Set(['development', 'test']);
  const env = environment || '';

  if (!allowed.has(env)) {
    throw new Error(
      `Sample data seed is allowed only in development/test environments (got: "${env}")`,
    );
  }
}

module.exports = {
  SAMPLE_TEAMS,
  SAMPLE_PLAYERS,
  seedSampleTeams,
  assertSeedEnvironmentAllowed,
};
