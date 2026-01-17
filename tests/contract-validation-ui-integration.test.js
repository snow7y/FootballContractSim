// 妥当性検証とリアルタイム警告の統合テスト（構造チェック）

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'ContractFlow.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('ContractFlow.tsx not found');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('validateContractTermsAction')) {
    throw new Error('ContractFlow should validate contract terms');
  }
  if (!content.includes('契約条件の警告')) {
    throw new Error('ContractFlow should render warnings section');
  }
  if (!content.includes('警告あり')) {
    throw new Error('ContractFlow should show warning indicator');
  }

  console.log('contract-validation-ui-integration.test.js passed (structure checks).');
})();
