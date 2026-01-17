// 失敗時の要約と詳細出力を検証するテスト

const path = require('path');
const { spawnSync } = require('child_process');

(function main() {
  if (process.env.TEST_EXECUTION_ACTIVE === '1') {
    console.log('test-execution-cli-failure-summary.test.js skipped (executed by test runner).');
    return;
  }

  const rootDir = path.join(__dirname, '..');
  const cliPath = path.join(rootDir, 'scripts', 'test-execution.js');
  const targetFile = path.join('tests', 'test-execution-failure.test.js');

  const result = spawnSync('node', [cliPath, '--file', targetFile], {
    encoding: 'utf8',
    env: {
      ...process.env,
      TEST_EXECUTION_FORCE_FAILURE: '1',
    },
  });

  if (result.status === 0) {
    throw new Error('failure run should return non-zero exit status');
  }

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (!/Failed/i.test(output)) {
    throw new Error('failure run should include failure summary');
  }

  if (!/test-execution-failure.test.js/.test(output)) {
    throw new Error('failure run should mention the failed test file');
  }

  console.log('test-execution-cli-failure-summary.test.js passed (failure summary).');
})();
