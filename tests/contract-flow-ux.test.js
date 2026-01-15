// ContractFlow UI の主要状態表示を構造的に検証するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'ContractFlow.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('ContractFlow not found at src/app/contracts/ContractFlow.tsx');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('契約確定処理中')) {
    throw new Error('ContractFlow should show pending state feedback');
  }
  if (!content.includes('契約対象がまだ登録されていません')) {
    throw new Error('ContractFlow should render empty state message');
  }
  if (!content.includes('契約期間は開始日より終了日を後にしてください')) {
    throw new Error('ContractFlow should show date validation error');
  }

  console.log('contract-flow-ux.test.js passed (structure checks).');
})();
