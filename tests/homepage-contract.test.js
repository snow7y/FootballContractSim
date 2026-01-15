// HomePage に契約フローが組み込まれていることを確認するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('Home page not found at src/app/page.tsx');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('ContractFlow')) {
    throw new Error('Home page should include ContractFlow component');
  }
  if (!content.includes('契約を開始')) {
    throw new Error('Home page should mention contract CTA text');
  }

  console.log('homepage-contract.test.js passed (structure checks).');
})();
