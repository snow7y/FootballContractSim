// Home page に既存管理導線が残っていることを確認するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('Home page not found at src/app/page.tsx');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('href="/players"')) {
    throw new Error('Home page should include link to /players');
  }
  if (!content.includes('href="/teams"')) {
    throw new Error('Home page should include link to /teams');
  }

  console.log('homepage-links.test.js passed (structure checks).');
})();
