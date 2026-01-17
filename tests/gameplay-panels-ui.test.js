// Goal/Score/History などゲームプレイパネル UI の構造テスト

const fs = require('fs');
const path = require('path');

(function main() {
  const panelPaths = [
    'PhaseProgress.tsx',
    'GoalPanel.tsx',
    'ActionFeedback.tsx',
    'ActionHistory.tsx',
    'ScorePanel.tsx',
  ].map((file) => path.join(__dirname, '..', 'src', 'app', 'contracts', file));

  panelPaths.forEach((panelPath) => {
    if (!fs.existsSync(panelPath)) {
      throw new Error(`Panel component not found at ${panelPath}`);
    }
  });

  const phaseContent = fs.readFileSync(panelPaths[0], 'utf8');
  const goalContent = fs.readFileSync(panelPaths[1], 'utf8');
  const feedbackContent = fs.readFileSync(panelPaths[2], 'utf8');
  const historyContent = fs.readFileSync(panelPaths[3], 'utf8');
  const scoreContent = fs.readFileSync(panelPaths[4], 'utf8');

  if (!phaseContent.includes('フェーズ') || !phaseContent.includes('残り')) {
    throw new Error('PhaseProgress should include phase and remaining steps text');
  }
  if (!goalContent.includes('目標') || !goalContent.includes('達成')) {
    throw new Error('GoalPanel should include goals and completion labels');
  }
  if (!feedbackContent.includes('アクション結果') || !feedbackContent.includes('処理中')) {
    throw new Error('ActionFeedback should include action result and pending text');
  }
  if (!historyContent.includes('履歴')) {
    throw new Error('ActionHistory should include history text');
  }
  if (!scoreContent.includes('スコア') || !scoreContent.includes('指標')) {
    throw new Error('ScorePanel should include score and metric text');
  }

  console.log('gameplay-panels-ui.test.js passed (structure checks).');
})();
