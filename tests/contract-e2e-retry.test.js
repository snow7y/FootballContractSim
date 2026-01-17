// 試行回数追跡シナリオのE2Eテスト（構造チェック）

const fs = require('fs');
const path = require('path');

(function main() {
  const servicePath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'player-dialogue-service.ts');
  if (!fs.existsSync(servicePath)) {
    throw new Error('player-dialogue-service.ts not found');
  }

  const content = fs.readFileSync(servicePath, 'utf8');

  if (!content.includes('failureCount >= 3')) {
    throw new Error('Dialogue service should change tone after repeated failures');
  }
  if (!content.includes('何度も同じ話')) {
    throw new Error('Dialogue service should include harsh failure messaging');
  }

  console.log('contract-e2e-retry.test.js passed (structure checks).');
})();
