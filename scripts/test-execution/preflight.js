const fs = require('node:fs');
const path = require('node:path');

function resolveTsxBin(rootDir = process.cwd()) {
  const isWindows = process.platform === 'win32';
  return path.join(rootDir, 'node_modules', '.bin', isWindows ? 'tsx.cmd' : 'tsx');
}

function validatePreflight({ testsDir, requireTsx = false, rootDir = process.cwd() }) {
  if (!fs.existsSync(testsDir)) {
    return {
      ok: false,
      message: `tests ディレクトリが見つかりません: ${testsDir}`,
      remedies: ['tests ディレクトリが存在することを確認してください。'],
    };
  }

  if (requireTsx) {
    const tsxBin = resolveTsxBin(rootDir);
    if (!fs.existsSync(tsxBin)) {
      return {
        ok: false,
        message: 'tsx 実行バイナリが見つかりません。',
        remedies: ['npm install を実行して tsx を導入してください。'],
      };
    }
  }

  return { ok: true };
}

module.exports = {
  resolveTsxBin,
  validatePreflight,
};
