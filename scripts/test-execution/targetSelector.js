const fs = require('node:fs');
const path = require('node:path');

const LEGACY_EXCLUDED = ['legacy-suite.test.ts'];

function listAllTests(testsDir) {
  if (!fs.existsSync(testsDir)) {
    return [];
  }

  return fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith('.test.js') || file.endsWith('.test.ts'))
    .filter((file) => !LEGACY_EXCLUDED.includes(file))
    .map((file) => path.join(testsDir, file))
    .sort((a, b) => a.localeCompare(b));
}

function resolveTargets(request, { testsDir, rootDir = process.cwd() }) {
  const allTests = listAllTests(testsDir);
  const candidates = allTests.map((filePath) => path.relative(rootDir, filePath));

  if (!request.targets || request.targets.length === 0) {
    return { targets: allTests };
  }

  const resolved = new Set();

  for (const target of request.targets) {
    if (target.kind === 'area') {
      const matches = allTests.filter((filePath) =>
        path.basename(filePath).includes(target.value),
      );
      if (matches.length === 0) {
        return {
          error: {
            message: `対象領域が見つかりません: ${target.value}`,
            candidates,
          },
        };
      }
      matches.forEach((match) => resolved.add(match));
      continue;
    }

    if (target.kind === 'file') {
      const resolvedFile = resolveFileTarget(target.value, { testsDir, rootDir, allTests });
      if (!resolvedFile) {
        return {
          error: {
            message: `対象ファイルが見つかりません: ${target.value}`,
            candidates,
          },
        };
      }
      resolved.add(resolvedFile);
      continue;
    }

    return {
      error: {
        message: `未知のターゲット種別です: ${target.kind}`,
        candidates,
      },
    };
  }

  return { targets: Array.from(resolved) };
}

function resolveFileTarget(value, { testsDir, rootDir, allTests }) {
  const absoluteFromRoot = path.isAbsolute(value) ? value : path.join(rootDir, value);
  if (fs.existsSync(absoluteFromRoot)) {
    return absoluteFromRoot;
  }

  const absoluteFromTests = path.join(testsDir, value);
  if (fs.existsSync(absoluteFromTests)) {
    return absoluteFromTests;
  }

  const byName = allTests.find((filePath) => path.basename(filePath) === path.basename(value));
  if (byName) {
    return byName;
  }

  return null;
}

module.exports = {
  listAllTests,
  resolveTargets,
};
