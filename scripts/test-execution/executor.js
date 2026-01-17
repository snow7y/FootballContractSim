const { spawnSync } = require('node:child_process');
const path = require('node:path');

function resolveTsxBin(rootDir = process.cwd()) {
  const isWindows = process.platform === 'win32';
  return path.join(rootDir, 'node_modules', '.bin', isWindows ? 'tsx.cmd' : 'tsx');
}

function runTestFile(filePath, { rootDir = process.cwd() } = {}) {
  const isTypeScript = filePath.endsWith('.ts');
  const command = isTypeScript ? resolveTsxBin(rootDir) : process.execPath;
  const args = [filePath];
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      TEST_EXECUTION_ACTIVE: '1',
    },
  });

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

module.exports = {
  resolveTsxBin,
  runTestFile,
};
