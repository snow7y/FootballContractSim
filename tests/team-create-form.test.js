// CreateTeamForm コンポーネントに関する簡易テスト
// 目的: コンポーネントファイルの存在と、必須/任意フィールドに対応するidやnameが含まれていることを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'teams', 'CreateTeamForm.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('CreateTeamForm not found at src/app/teams/CreateTeamForm.tsx');
  }
  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('export default function CreateTeamForm')) {
    throw new Error('CreateTeamForm should export default function CreateTeamForm');
  }
  if (!content.includes('id="name"') || !content.includes('name="name"')) {
    throw new Error('CreateTeamForm should have required name field');
  }
  if (!content.includes('id="country"') || !content.includes('name="country"')) {
    throw new Error('CreateTeamForm should have optional country field');
  }
  if (!content.includes('id="foundedYear"') || !content.includes('name="foundedYear"')) {
    throw new Error('CreateTeamForm should have optional foundedYear field');
  }

  console.log('team-create-form.test.js passed (structure checks).');
})();
