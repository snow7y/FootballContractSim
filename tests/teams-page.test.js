// Simple existence test for /src/app/teams/page.tsx
// RED: このスクリプトは Teams ページがまだ存在しない間は失敗する想定

const fs = require('fs');
const path = require('path');

(function main() {
  const target = path.join(__dirname, '..', 'src', 'app', 'teams', 'page.tsx');
  if (!fs.existsSync(target)) {
    throw new Error('Teams page not found at src/app/teams/page.tsx');
  }
  const content = fs.readFileSync(target, 'utf8');
  if (!content.includes('export default async function TeamsPage')) {
    throw new Error('TeamsPage default export not found in page.tsx');
  }
})();
