// sample-data-seed CLI エントリと npm スクリプトの存在を検証するテスト

const fs = require('fs');
const path = require('path');

(function main() {
  const rootDir = path.join(__dirname, '..');
  const pkgPath = path.join(rootDir, 'package.json');
  const cliPath = path.join(rootDir, 'scripts', 'sample-data-seed.js');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found at project root');
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts || typeof pkg.scripts['seed:sample'] !== 'string') {
    throw new Error('npm script "seed:sample" must be defined in package.json');
  }

  const expectedCommand = 'node scripts/sample-data-seed.js';
  if (!pkg.scripts['seed:sample'].includes(expectedCommand)) {
    throw new Error(
      `"seed:sample" script should include "${expectedCommand}" but was "${pkg.scripts['seed:sample']}"`,
    );
  }

  if (!fs.existsSync(cliPath)) {
    throw new Error('CLI entry script not found at scripts/sample-data-seed.js');
  }

  console.log('sample-data-seed-cli.test.js passed (structure checks).');
})();
