// 推奨条件取得と表示の統合テスト（構造チェック）

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'ContractFlow.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('ContractFlow.tsx not found');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('getContractRecommendation')) {
    throw new Error('ContractFlow should request contract recommendation');
  }
  if (!content.includes('推奨条件')) {
    throw new Error('ContractFlow should render recommendation section');
  }
  if (!content.includes('推奨年俸')) {
    throw new Error('ContractFlow should show recommended wage range');
  }
  if (!content.includes('推奨契約期間')) {
    throw new Error('ContractFlow should show recommended contract years');
  }

  console.log('contract-recommendation-ui-integration.test.js passed (structure checks).');
})();
