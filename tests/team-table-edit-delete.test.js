// TeamTable の編集・削除ハンドリングに関する簡易テスト
// 目的: コンポーネントが編集/削除用のボタンとdata-testidを持っていることを確認する

const fs = require('fs');
const path = require('path');

(function main() {
  const targetPath = path.join(__dirname, '..', 'src', 'app', 'teams', 'TeamTable.tsx');
  if (!fs.existsSync(targetPath)) {
    throw new Error('TeamTable not found at src/app/teams/TeamTable.tsx');
  }
  const content = fs.readFileSync(targetPath, 'utf8');

  if (!content.includes('data-testid="edit-button"')) {
    throw new Error('TeamTable should render edit button with data-testid="edit-button"');
  }
  if (!content.includes('data-testid="delete-button"')) {
    throw new Error('TeamTable should render delete button with data-testid="delete-button"');
  }
  if (!content.includes('useTransition')) {
    throw new Error('TeamTable should use useTransition for pending state handling');
  }

  console.log('team-table-edit-delete.test.js passed (structure checks).');
})();
