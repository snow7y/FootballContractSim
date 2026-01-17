// 契約作成失敗フローの統合テスト（構造チェック）

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'contract-actions.ts');
  if (!fs.existsSync(targetPath)) {
    throw new Error('contract-actions.ts not found');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes("type: 'NegotiationFailed'")) {
    throw new Error('Contract actions should include NegotiationFailed error type');
  }
  if (!content.includes("actionType: 'ContractFailed'")) {
    throw new Error('Contract creation should record ContractFailed action');
  }
  if (!content.includes('meta:negotiation=failed')) {
    throw new Error('Contract failure should include negotiation failure metadata');
  }
  if (!content.includes('generatePlayerDialogue')) {
    throw new Error('Contract failure should generate player dialogue');
  }

  console.log('contract-integration-failure.test.js passed (structure checks).');
})();
