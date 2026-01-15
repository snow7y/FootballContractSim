// UserContext サーバアクションに関する簡易テスト
// 目的: getCurrentUser / setCurrentUser / createUser / listUsers の存在と cookies/prisma 利用を確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'user-actions.ts');
  if (!fs.existsSync(targetPath)) {
    throw new Error('User actions file not found at src/app/contracts/user-actions.ts');
  }

  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('export async function getCurrentUser')) {
    throw new Error('User actions should export async function getCurrentUser');
  }
  if (!content.includes('export async function setCurrentUser')) {
    throw new Error('User actions should export async function setCurrentUser');
  }
  if (!content.includes('export async function createUser')) {
    throw new Error('User actions should export async function createUser');
  }
  if (!content.includes('export async function listUsers')) {
    throw new Error('User actions should export async function listUsers');
  }

  if (!content.includes('cookies()')) {
    throw new Error('User actions should use cookies() to manage current user');
  }
  if (!content.includes('prisma.user')) {
    throw new Error('User actions should use prisma.user for persistence');
  }

  console.log('user-context-actions.test.js passed (structure checks).');
})();
