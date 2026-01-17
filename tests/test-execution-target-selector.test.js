// TargetSelector の解決ルールを検証するテスト

const path = require('path');

const {
  resolveTargets,
  listAllTests,
} = require('../scripts/test-execution/targetSelector');

(function main() {
  const testsDir = path.join(__dirname);

  const allTests = listAllTests(testsDir);
  if (!Array.isArray(allTests) || allTests.length === 0) {
    throw new Error('listAllTests should return at least one test file');
  }

  if (allTests.some((filePath) => filePath.endsWith('legacy-suite.test.ts'))) {
    throw new Error('legacy-suite.test.ts should be excluded from legacy execution targets');
  }

  const defaultResult = resolveTargets(
    {
      mode: 'local',
      targets: [],
      output: 'human',
    },
    { testsDir },
  );

  if (defaultResult.error) {
    throw new Error(`default target resolution failed: ${defaultResult.error.message}`);
  }

  if (!defaultResult.targets || defaultResult.targets.length === 0) {
    throw new Error('default target resolution should include at least one test');
  }

  const contractResult = resolveTargets(
    {
      mode: 'local',
      targets: [{ kind: 'area', value: 'contract' }],
      output: 'human',
    },
    { testsDir },
  );

  if (contractResult.error) {
    throw new Error(`area target resolution failed: ${contractResult.error.message}`);
  }

  const contractMatch = contractResult.targets.find((filePath) =>
    filePath.includes('contract-actions.test.js'),
  );

  if (!contractMatch) {
    throw new Error('area "contract" should include contract-actions.test.js');
  }

  const fileResult = resolveTargets(
    {
      mode: 'local',
      targets: [{ kind: 'file', value: 'tests/contract-actions.test.js' }],
      output: 'human',
    },
    { testsDir },
  );

  if (fileResult.error) {
    throw new Error(`file target resolution failed: ${fileResult.error.message}`);
  }

  if (fileResult.targets.length !== 1 || !fileResult.targets[0].endsWith('contract-actions.test.js')) {
    throw new Error('file target resolution should return the exact test file');
  }

  const multiResult = resolveTargets(
    {
      mode: 'local',
      targets: [
        { kind: 'area', value: 'team' },
        { kind: 'file', value: 'tests/contract-actions.test.js' },
      ],
      output: 'human',
    },
    { testsDir },
  );

  if (multiResult.error) {
    throw new Error(`multi target resolution failed: ${multiResult.error.message}`);
  }

  if (multiResult.targets.length < 2) {
    throw new Error('multi target resolution should combine multiple targets');
  }

  const missingResult = resolveTargets(
    {
      mode: 'local',
      targets: [{ kind: 'file', value: 'tests/does-not-exist.test.js' }],
      output: 'human',
    },
    { testsDir },
  );

  if (!missingResult.error) {
    throw new Error('missing target should return an error');
  }

  if (!missingResult.error.candidates || missingResult.error.candidates.length === 0) {
    throw new Error('missing target should include candidates');
  }

  console.log('test-execution-target-selector.test.js passed (target resolution).');
})();
