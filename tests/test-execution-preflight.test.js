// PreflightValidator の検証テスト

const path = require('path');

const { validatePreflight } = require('../scripts/test-execution/preflight');

(function main() {
  const testsDir = path.join(__dirname);

  const okResult = validatePreflight({ testsDir, requireTsx: false });
  if (!okResult.ok) {
    throw new Error(`expected preflight ok but got error: ${okResult.message}`);
  }

  const missingResult = validatePreflight({
    testsDir: path.join(__dirname, '__missing_tests__'),
    requireTsx: false,
  });

  if (missingResult.ok) {
    throw new Error('preflight should fail when tests directory is missing');
  }

  if (!missingResult.remedies || missingResult.remedies.length === 0) {
    throw new Error('preflight error should include remedies');
  }

  console.log('test-execution-preflight.test.js passed (preflight validation).');
})();
