// GameplayStateService の構造テスト

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(
    __dirname,
    '..',
    'src',
    'app',
    'contracts',
    'gameplay-state-service.ts'
  );

  if (!fs.existsSync(targetPath)) {
    throw new Error('Gameplay state service not found at src/app/contracts/gameplay-state-service.ts');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('export async function getDashboardData')) {
    throw new Error('Gameplay state service should export getDashboardData');
  }
  if (!content.includes('export async function updatePhase')) {
    throw new Error('Gameplay state service should export updatePhase');
  }
  if (!content.includes('export async function recordAction')) {
    throw new Error('Gameplay state service should export recordAction');
  }
  if (!content.includes('export async function refreshScore')) {
    throw new Error('Gameplay state service should export refreshScore');
  }

  if (!content.includes('type PhaseStatus') || !content.includes('type GoalStatus')) {
    throw new Error('Gameplay state service should define PhaseStatus and GoalStatus types');
  }
  if (!content.includes('type GameplayStateResult') || !content.includes('type GameplayStateError')) {
    throw new Error('Gameplay state service should define GameplayStateResult and GameplayStateError types');
  }

  if (!content.includes('getCurrentUser')) {
    throw new Error('Gameplay state service should use getCurrentUser for user context');
  }
  if (!content.includes('prisma')) {
    throw new Error('Gameplay state service should use prisma for persistence');
  }
  if (!content.includes('UserContextMissing')) {
    throw new Error('Gameplay state service should return UserContextMissing error');
  }
  if (!content.includes('stepIndex') || !content.includes('totalSteps')) {
    throw new Error('Gameplay state service should validate stepIndex and totalSteps');
  }

  console.log('gameplay-state-service.test.js passed (structure checks).');
})();
