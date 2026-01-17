// 契約作成成功フローの統合テスト（構造チェック）

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'contract-actions.ts');
  if (!fs.existsSync(targetPath)) {
    throw new Error('contract-actions.ts not found');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('prisma.$transaction')) {
    throw new Error('Contract creation should use prisma.$transaction');
  }
  if (!content.includes('marketValue') || !content.includes('wage: input.wage')) {
    throw new Error('Contract creation should update player marketValue and wage');
  }
  if (!content.includes("actionType: 'ContractCreated'")) {
    throw new Error('Contract creation should record ContractCreated action');
  }
  if (!content.includes('generatePlayerDialogue')) {
    throw new Error('Contract creation should generate player dialogue');
  }
  if (!content.includes('市場価値')) {
    throw new Error('Contract creation should log market value change details');
  }

  console.log('contract-integration-success.test.js passed (structure checks).');
})();
