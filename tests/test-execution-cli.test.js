// test-execution CLI エントリと npm スクリプトの存在を検証するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const rootDir = path.join(__dirname, '..');
  const pkgPath = path.join(rootDir, 'package.json');
  const cliPath = path.join(rootDir, 'scripts', 'test-execution.js');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found at project root');
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts || typeof pkg.scripts.test !== 'string') {
    throw new Error('npm script "test" must be defined in package.json');
  }

  const expectedCommand = 'node scripts/test-execution.js';
  if (!pkg.scripts.test.includes(expectedCommand)) {
    throw new Error(`"test" script should include "${expectedCommand}" but was "${pkg.scripts.test}"`);
  }

  if (!pkg.scripts || typeof pkg.scripts['test:ci'] !== 'string') {
    throw new Error('npm script "test:ci" must be defined in package.json');
  }

  if (!pkg.scripts['test:ci'].includes(expectedCommand)) {
    throw new Error(
      `"test:ci" script should include "${expectedCommand}" but was "${pkg.scripts['test:ci']}"`,
    );
  }

  if (!fs.existsSync(cliPath)) {
    throw new Error('CLI entry script not found at scripts/test-execution.js');
  }

  console.log('test-execution-cli.test.js passed (structure checks).');
})();
