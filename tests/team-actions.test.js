// TeamActions サーバアクションに関する簡易テスト
// 目的: createTeam / updateTeam / deleteTeam と revalidatePath('/teams') が定義されていることを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'teams', 'actions.ts');
  if (!fs.existsSync(targetPath)) {
    throw new Error('TeamActions file not found at src/app/teams/actions.ts');
  }
  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('export async function createTeam')) {
    throw new Error('TeamActions should export async function createTeam');
  }
  if (!content.includes('export async function updateTeam')) {
    throw new Error('TeamActions should export async function updateTeam');
  }
  if (!content.includes('export async function deleteTeam')) {
    throw new Error('TeamActions should export async function deleteTeam');
  }
  if (!content.includes("revalidatePath('/teams')") && !content.includes("revalidatePath(\"/teams\")")) {
    throw new Error("TeamActions should call revalidatePath('/teams')");
  }

  console.log('team-actions.test.js passed (structure checks).');
})();
