// Simple existence/shape test for TeamTable component
// RED: TeamTable が存在しない間は失敗する想定

const fs = require('fs');
const path = require('path');

(function main() {
  const target = path.join(__dirname, '..', 'src', 'app', 'teams', 'TeamTable.tsx');
  if (!fs.existsSync(target)) {
    throw new Error('TeamTable not found at src/app/teams/TeamTable.tsx');
  }
  const content = fs.readFileSync(target, 'utf8');
  if (!content.includes('export default function TeamTable')) {
    throw new Error('TeamTable default export not found in TeamTable.tsx');
  }
})();
