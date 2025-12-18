// /teams ページと TeamActions の統合に関する簡易テスト
// 目的: CreateTeamForm と TeamTable が TeamActions をimportしていることを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const formPath = path.join(__dirname, '..', 'src', 'app', 'teams', 'CreateTeamForm.tsx');
  const tablePath = path.join(__dirname, '..', 'src', 'app', 'teams', 'TeamTable.tsx');

  if (!fs.existsSync(formPath)) {
    throw new Error('CreateTeamForm not found at src/app/teams/CreateTeamForm.tsx');
  }
  if (!fs.existsSync(tablePath)) {
    throw new Error('TeamTable not found at src/app/teams/TeamTable.tsx');
  }

  const formContent = fs.readFileSync(formPath, 'utf8');
  const tableContent = fs.readFileSync(tablePath, 'utf8');

  if (!formContent.includes("import { createTeam } from './actions'")) {
    throw new Error('CreateTeamForm should import createTeam from ./actions');
  }
  if (!tableContent.includes("import { updateTeam, deleteTeam } from './actions'")) {
    throw new Error('TeamTable should import updateTeam and deleteTeam from ./actions');
  }

  console.log('teams-integration.test.js passed (structure checks).');
})();
