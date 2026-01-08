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
async function seedSampleTeams(prisma, options = {}) {
  const sampleTeams = options.teams ?? SAMPLE_TEAMS;
  const errors = options.errors;
  let teamsCreated = 0;
  let teamsUpdated = 0;

  for (const team of sampleTeams) {
    try {
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
    } catch (error) {
      pushSeedError(errors, 'Team', team.name, error);
      throw error;
    }
  }

  return { teamsCreated, teamsUpdated };
}

/**
 * Player.name + position を論理キーとみなし、既存レコードがあれば更新、なければ作成する。
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ players?: typeof SAMPLE_PLAYERS }} [options]
 * @returns {Promise<{ playersCreated: number; playersUpdated: number }>}
 */
async function seedSamplePlayers(prisma, options = {}) {
  const samplePlayers = options.players ?? SAMPLE_PLAYERS;
  const errors = options.errors;
  let playersCreated = 0;
  let playersUpdated = 0;

  for (const player of samplePlayers) {
    try {
      const data = {
        name: player.name,
        position: player.position,
        nationality: player.nationality ?? null,
        age: player.age,
        overall: player.overall,
        potential: player.potential,
        currentClub: player.currentClub ?? null,
        contractUntil: player.contractUntil ? new Date(player.contractUntil) : null,
        marketValue: player.marketValue ?? null,
        wage: player.wage ?? null,
      };

      const existing = await prisma.player.findFirst({
        where: {
          name: player.name,
          position: player.position,
        },
      });

      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data,
        });
        playersUpdated += 1;
      } else {
        await prisma.player.create({ data });
        playersCreated += 1;
      }
    } catch (error) {
      pushSeedError(errors, 'Player', player.name, error);
      throw error;
    }
  }

  return { playersCreated, playersUpdated };
}

/**
 * Team / Player のシードを単一トランザクションで実行し、部分的なコミットを防ぐ。
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ teams?: typeof SAMPLE_TEAMS; players?: typeof SAMPLE_PLAYERS }} [options]
 * @returns {Promise<{ teamsCreated: number; teamsUpdated: number; playersCreated: number; playersUpdated: number; errors: SampleDataSeedErrorDetail[] }>}
 */
async function seedSampleData(prisma, options = {}) {
  if (!prisma || typeof prisma.$transaction !== 'function') {
    throw new Error('Prisma client with $transaction is required for seedSampleData');
  }
  const result = createEmptySeedResult();

  try {
    await prisma.$transaction(async (tx) => {
      const teamResult = await seedSampleTeams(tx, {
        teams: options.teams,
        errors: result.errors,
      });
      const playerResult = await seedSamplePlayers(tx, {
        players: options.players,
        errors: result.errors,
      });

      result.teamsCreated = teamResult.teamsCreated;
      result.teamsUpdated = teamResult.teamsUpdated;
      result.playersCreated = playerResult.playersCreated;
      result.playersUpdated = playerResult.playersUpdated;
    });
    return result;
  } catch (error) {
    if (result.errors.length === 0) {
      pushSeedError(result.errors, 'Unknown', 'N/A', error);
    }
    throw new SampleDataSeedError('Sample data seed failed', result, error);
  }
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
class SampleDataSeedError extends Error {
  /**
   *
   * @param {string} message
   * @param {SampleDataSeedResult} result
   * @param {unknown} cause
   */
  constructor(message, result, cause) {
    super(message);
    this.name = 'SampleDataSeedError';
    this.result = result;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * @typedef {{ entity: 'Team' | 'Player' | 'Unknown'; identifier: string; message: string }} SampleDataSeedErrorDetail
 * @typedef {{ teamsCreated: number; teamsUpdated: number; playersCreated: number; playersUpdated: number; errors: SampleDataSeedErrorDetail[] }} SampleDataSeedResult
 */

/**
 * @returns {SampleDataSeedResult}
 */
function createEmptySeedResult() {
  return {
    teamsCreated: 0,
    teamsUpdated: 0,
    playersCreated: 0,
    playersUpdated: 0,
    errors: [],
  };
}

/**
 * @param {SampleDataSeedErrorDetail[] | undefined} errors
 * @param {'Team' | 'Player' | 'Unknown'} entity
 * @param {string} identifier
 * @param {unknown} error
 */
function pushSeedError(errors, entity, identifier, error) {
  if (!Array.isArray(errors)) {
    return;
  }
  errors.push({
    entity,
    identifier,
    message: error && error.message ? String(error.message) : String(error),
  });
}

module.exports = {
  SAMPLE_TEAMS,
  SAMPLE_PLAYERS,
  SampleDataSeedError,
  createEmptySeedResult,
  seedSampleData,
  seedSampleTeams,
  seedSamplePlayers,
  assertSeedEnvironmentAllowed,
};
