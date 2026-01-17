// Login Gate と Dashboard UI の構造テスト

const fs = require('fs');
const path = require('path');

(function main() {
  const gatePath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'UserLoginGate.tsx');
  const dashboardPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'DashboardSummary.tsx');
  const contextPath = path.join(__dirname, '..', 'src', 'app', 'contracts', 'UserContextPanel.tsx');
  const homePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');

  if (!fs.existsSync(gatePath)) {
    throw new Error('UserLoginGate not found at src/app/contracts/UserLoginGate.tsx');
  }
  if (!fs.existsSync(dashboardPath)) {
    throw new Error('DashboardSummary not found at src/app/contracts/DashboardSummary.tsx');
  }
  if (!fs.existsSync(contextPath)) {
    throw new Error('UserContextPanel not found at src/app/contracts/UserContextPanel.tsx');
  }
  if (!fs.existsSync(homePath)) {
    throw new Error('Home page not found at src/app/page.tsx');
  }

  const gateContent = fs.readFileSync(gatePath, 'utf8');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  const homeContent = fs.readFileSync(homePath, 'utf8');

  if (!gateContent.includes('export default function UserLoginGate')) {
    throw new Error('UserLoginGate should export default function UserLoginGate');
  }
  if (!gateContent.includes('ユーザーを選択') || !gateContent.includes('新規ユーザー')) {
    throw new Error('UserLoginGate should include user selection and creation guidance');
  }
  if (!contextContent.includes('現在のユーザー')) {
    throw new Error('UserContextPanel should show current user text');
  }

  if (!dashboardContent.includes('ダッシュボード')) {
    throw new Error('DashboardSummary should include dashboard heading');
  }
  if (!dashboardContent.includes('空状態') && !dashboardContent.includes('まだデータがありません')) {
    throw new Error('DashboardSummary should include empty state guidance');
  }

  if (!homeContent.includes('UserLoginGate')) {
    throw new Error('Home page should include UserLoginGate component');
  }

  console.log('gameplay-login-dashboard-ui.test.js passed (structure checks).');
})();
