// ContractService サーバアクションに関する簡易テスト
// 目的: createContract / getContractById が存在し、エラー分類が定義されていることを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'contract-actions.ts');
  if (!fs.existsSync(targetPath)) {
    throw new Error('Contract actions file not found at src/app/contracts/contract-actions.ts');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('export async function createContract')) {
    throw new Error('Contract actions should export async function createContract');
  }
  if (!content.includes('export async function getContractById')) {
    throw new Error('Contract actions should export async function getContractById');
  }

  if (!content.includes("type: 'UserContextMissing'")) {
    throw new Error('Contract actions should define UserContextMissing error type');
  }
  if (!content.includes("type: 'Validation'")) {
    throw new Error('Contract actions should define Validation error type');
  }
  if (!content.includes("type: 'NotFound'")) {
    throw new Error('Contract actions should define NotFound error type');
  }
  if (!content.includes("type: 'Conflict'")) {
    throw new Error('Contract actions should define Conflict error type');
  }

  if (!content.includes('startDate') || !content.includes('endDate') || !content.includes('wage')) {
    throw new Error('Contract actions should validate startDate/endDate/wage fields');
  }

  console.log('contract-actions.test.js passed (structure checks).');
})();
