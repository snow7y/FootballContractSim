// 未知モード指定時の案内を検証するテスト

const path = require('path');
const { spawnSync } = require('child_process');

(function main() {
  if (process.env.TEST_EXECUTION_ACTIVE === '1') {
    console.log('test-execution-cli-unknown-mode.test.js skipped (executed by test runner).');
    return;
  }

  const rootDir = path.join(__dirname, '..');
  const cliPath = path.join(rootDir, 'scripts', 'test-execution.js');

  const result = spawnSync('node', [cliPath, '--mode=unknown'], {
    encoding: 'utf8',
  });

  if (result.status === 0) {
    throw new Error('unknown mode should return non-zero exit status');
  }

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (!/available modes/i.test(output)) {
    throw new Error('unknown mode should print available modes');
  }

  if (!/local/.test(output) || !/ci/.test(output)) {
    throw new Error('available modes output should mention local and ci');
  }

  console.log('test-execution-cli-unknown-mode.test.js passed (unknown mode guidance).');
})();
