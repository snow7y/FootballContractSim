// サンプル Player データセットの仕様を検証するテスト

const path = require('path');
const fs = require('fs');
const { Position } = require('@prisma/client');

(function main() {
  const rootDir = path.join(__dirname, '..');
  const servicePath = path.join(rootDir, 'src', 'seed', 'sampleDataSeedService.js');

  if (!fs.existsSync(servicePath)) {
    throw new Error('SampleDataSeedService module not found at src/seed/sampleDataSeedService.js');
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const service = require(servicePath);
  const { SAMPLE_TEAMS, SAMPLE_PLAYERS } = service;

  if (!Array.isArray(SAMPLE_PLAYERS) || SAMPLE_PLAYERS.length === 0) {
    throw new Error('SAMPLE_PLAYERS must be a non-empty array');
  }

  const teamNames = new Set((SAMPLE_TEAMS || []).map((t) => t.name));
  const positions = new Set(Object.values(Position));

  const seenPositions = new Set();
  const seenClubs = new Set();

  for (const player of SAMPLE_PLAYERS) {
    if (!player.name || typeof player.name !== 'string') {
      throw new Error('Each sample player must have a string name');
    }
    if (!positions.has(player.position)) {
      throw new Error(`Invalid position for sample player: ${player.name}`);
    }
    if (typeof player.age !== 'number' || player.age < 16 || player.age > 40) {
      throw new Error(`Invalid age for sample player: ${player.name}`);
    }
    if (typeof player.overall !== 'number' || player.overall < 0 || player.overall > 100) {
      throw new Error(`Invalid overall for sample player: ${player.name}`);
    }
    if (typeof player.potential !== 'number' || player.potential < 0 || player.potential > 100) {
      throw new Error(`Invalid potential for sample player: ${player.name}`);
    }
    if (player.marketValue != null && (typeof player.marketValue !== 'number' || player.marketValue <= 0)) {
      throw new Error(`Invalid marketValue for sample player: ${player.name}`);
    }
    if (player.wage != null && (typeof player.wage !== 'number' || player.wage <= 0)) {
      throw new Error(`Invalid wage for sample player: ${player.name}`);
    }
    if (player.currentClub) {
      if (!teamNames.has(player.currentClub)) {
        throw new Error(
          `currentClub for sample player ${player.name} must match one of SAMPLE_TEAMS names`,
        );
      }
      seenClubs.add(player.currentClub);
    }

    seenPositions.add(player.position);
  }

  if (seenPositions.size < 3) {
    throw new Error('SAMPLE_PLAYERS should cover at least three different positions');
  }
  if (seenClubs.size < 2) {
    throw new Error('SAMPLE_PLAYERS should reference at least two different clubs via currentClub');
  }

  console.log('sample-data-seed-player-spec.test.js passed (Player sample dataset spec).');
})();
