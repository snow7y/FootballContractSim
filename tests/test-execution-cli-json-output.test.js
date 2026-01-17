// 機械可読出力と進行状況表示を検証するテスト

const path = require('path');
const { spawnSync } = require('child_process');

(function main() {
  if (process.env.TEST_EXECUTION_ACTIVE === '1') {
    console.log('test-execution-cli-json-output.test.js skipped (executed by test runner).');
    return;
  }

  const rootDir = path.join(__dirname, '..');
  const cliPath = path.join(rootDir, 'scripts', 'test-execution.js');
  const targetFile = path.join('tests', 'test-execution-smoke.test.js');

  const result = spawnSync('node', [cliPath, '--file', targetFile, '--output', 'json'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`json output run should exit with 0 but exited with ${result.status}`);
  }

  if (!result.stdout) {
    throw new Error('json output run should produce stdout');
  }

  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`stdout should be valid json but got: ${result.stdout}`);
  }

  if (!payload.summary) {
    throw new Error('json output should include summary');
  }

  if (payload.summary.total !== 1 || payload.summary.passed !== 1) {
    throw new Error('json summary should reflect the single passing test');
  }

  const progressOutput = result.stderr || '';
  if (!/Running/.test(progressOutput)) {
    throw new Error('progress output should be written while running tests');
  }

  console.log('test-execution-cli-json-output.test.js passed (json output & progress).');
})();
