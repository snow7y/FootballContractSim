// ContractService のユーザー分離ロジックを構造的に検証するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'contract-actions.ts');
  if (!fs.existsSync(targetPath)) {
    throw new Error('Contract actions file not found at src/app/contracts/contract-actions.ts');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('contract.userId !== userContext.userId')) {
    throw new Error('Contract actions should reject access when userId mismatches');
  }
  if (!content.includes("type: 'Conflict'")) {
    throw new Error('Contract actions should define Conflict error type');
  }

  console.log('contract-user-scope.test.js passed (structure checks).');
})();
