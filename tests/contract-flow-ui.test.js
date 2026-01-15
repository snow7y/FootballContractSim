// ContractFlow UI コンポーネントに関する簡易テスト
// 目的: 主要な入力項目とCTAが存在することを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'ContractFlow.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('ContractFlow not found at src/app/contracts/ContractFlow.tsx');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('export default function ContractFlow')) {
    throw new Error('ContractFlow should export default function ContractFlow');
  }
  if (!content.includes('id="playerId"') || !content.includes('name="playerId"')) {
    throw new Error('ContractFlow should include playerId select input');
  }
  if (!content.includes('id="teamId"') || !content.includes('name="teamId"')) {
    throw new Error('ContractFlow should include teamId select input');
  }
  if (!content.includes('id="startDate"') || !content.includes('name="startDate"')) {
    throw new Error('ContractFlow should include startDate input');
  }
  if (!content.includes('id="endDate"') || !content.includes('name="endDate"')) {
    throw new Error('ContractFlow should include endDate input');
  }
  if (!content.includes('id="wage"') || !content.includes('name="wage"')) {
    throw new Error('ContractFlow should include wage input');
  }
  if (!content.includes('data-testid="contract-submit"')) {
    throw new Error('ContractFlow should include submit button with data-testid="contract-submit"');
  }

  console.log('contract-flow-ui.test.js passed (structure checks).');
})();
