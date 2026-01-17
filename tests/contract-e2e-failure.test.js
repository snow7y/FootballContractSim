// 契約作成失敗シナリオのE2Eテスト（構造チェック）

const fs = require('fs');
const path = require('path');

(function main() {
  const flowPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'ContractFlow.tsx');
  const feedbackPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'ActionFeedback.tsx');

  if (!fs.existsSync(flowPath) || !fs.existsSync(feedbackPath)) {
    throw new Error('ContractFlow or ActionFeedback not found');
  }

  const flowContent = fs.readFileSync(flowPath, 'utf8');
  const feedbackContent = fs.readFileSync(feedbackPath, 'utf8');

  if (!flowContent.includes('契約条件の警告')) {
    throw new Error('ContractFlow should show warning section');
  }
  if (!feedbackContent.includes('失敗')) {
    throw new Error('ActionFeedback should render failure label');
  }

  console.log('contract-e2e-failure.test.js passed (structure checks).');
})();
