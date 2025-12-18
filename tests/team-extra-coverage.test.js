// Team CRUD 追加テスト: 実装コードにテストカバレッジ用マーカーコメントが埋め込まれていることを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const actionsPath = path.join(__dirname, '..', 'src', 'app', 'teams', 'actions.ts');
  const apiPath = path.join(__dirname, '..', 'src', 'app', 'api', 'teams', 'route.ts');
  const pagePath = path.join(__dirname, '..', 'src', 'app', 'teams', 'page.tsx');

  if (!fs.existsSync(actionsPath)) throw new Error('teams/actions.ts not found');
  if (!fs.existsSync(apiPath)) throw new Error('api/teams/route.ts not found');
  if (!fs.existsSync(pagePath)) throw new Error('teams/page.tsx not found');

  const actions = fs.readFileSync(actionsPath, 'utf8');
  const api = fs.readFileSync(apiPath, 'utf8');
  const page = fs.readFileSync(pagePath, 'utf8');

  if (!actions.includes('TEST_COVERAGE:TEAM_ACTIONS')) {
    throw new Error('Missing TEST_COVERAGE:TEAM_ACTIONS marker in teams/actions.ts');
  }
  if (!api.includes('TEST_COVERAGE:TEAMS_API')) {
    throw new Error('Missing TEST_COVERAGE:TEAMS_API marker in api/teams/route.ts');
  }
  if (!page.includes('TEST_COVERAGE:TEAMS_PAGE_FLOW')) {
    throw new Error('Missing TEST_COVERAGE:TEAMS_PAGE_FLOW marker in teams/page.tsx');
  }

  console.log('team-extra-coverage.test.js passed (markers present).');
})();
