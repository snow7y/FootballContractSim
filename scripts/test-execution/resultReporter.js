const path = require('node:path');

function buildTestRunResult(results, { rootDir = process.cwd() } = {}) {
  const total = results.length;
  const failed = results.filter((result) => result.status !== 0).length;
  const passed = total - failed;
  const skipped = 0;
  const failures = results
    .filter((result) => result.status !== 0)
    .map((result) => {
      const relative = path.relative(rootDir, result.filePath);
      const stderr = result.stderr ? result.stderr.trim() : '';
      const detail = stderr ? `: ${stderr.split('\n')[0]}` : '';
      return `${relative}${detail}`;
    });

  return {
    summary: {
      total,
      passed,
      failed,
      skipped,
    },
    failures,
  };
}

function formatResult(result, format = 'human') {
  if (format === 'json') {
    return JSON.stringify(result);
  }

  const lines = [];
  lines.push(
    `Summary: total=${result.summary.total}, passed=${result.summary.passed}, failed=${result.summary.failed}, skipped=${result.summary.skipped}`,
  );

  if (result.failures.length > 0) {
    lines.push('Failed tests:');
    result.failures.forEach((failure) => {
      lines.push(` - ${failure}`);
    });
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  buildTestRunResult,
  formatResult,
};
