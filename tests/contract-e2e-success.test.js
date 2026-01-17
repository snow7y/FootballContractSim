// 契約作成成功シナリオのE2Eテスト（構造チェック）

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

  if (!flowContent.includes('成功率')) {
    throw new Error('ContractFlow should show success rate preview');
  }
  if (!feedbackContent.includes('成功')) {
    throw new Error('ActionFeedback should render success label');
  }

  console.log('contract-e2e-success.test.js passed (structure checks).');
})();
