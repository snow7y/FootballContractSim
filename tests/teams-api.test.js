// Teams API ルートの存在と基本的なエクスポート構造を検証するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const listRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'teams', 'route.ts');
  const detailRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'teams', '[id]', 'route.ts');

  if (!fs.existsSync(listRoutePath)) {
    throw new Error('Teams list route not found at src/app/api/teams/route.ts');
  }
  if (!fs.existsSync(detailRoutePath)) {
    throw new Error('Teams detail route not found at src/app/api/teams/[id]/route.ts');
  }

  const listContent = fs.readFileSync(listRoutePath, 'utf8');
  const detailContent = fs.readFileSync(detailRoutePath, 'utf8');

  if (!listContent.includes('export async function GET')) {
    throw new Error('Teams list route should export async function GET');
  }
  if (!listContent.includes('export async function POST')) {
    throw new Error('Teams list route should export async function POST');
  }
  if (!detailContent.includes('export async function GET')) {
    throw new Error('Teams detail route should export async function GET');
  }
  if (!detailContent.includes('export async function PUT')) {
    throw new Error('Teams detail route should export async function PUT');
  }
  if (!detailContent.includes('export async function DELETE')) {
    throw new Error('Teams detail route should export async function DELETE');
  }

  console.log('teams-api.test.js passed (structure checks).');
})();
