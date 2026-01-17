const path = require('node:path');
const { runTestFile } = require('./executor');

function runLegacySuite(filePaths, { onProgress, rootDir = process.cwd(), output = 'human' } = {}) {
  const results = [];
  const total = filePaths.length;

  filePaths.forEach((filePath, index) => {
    onProgress?.({
      index: index + 1,
      total,
      filePath,
    });

    const result = runTestFile(filePath, { rootDir });

    if (result.stdout) {
      if (output === 'json') {
        process.stderr.write(result.stdout);
      } else {
        process.stdout.write(result.stdout);
      }
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    results.push({
      filePath: path.normalize(filePath),
      ...result,
    });
  });

  return results;
}

module.exports = {
  runLegacySuite,
};
