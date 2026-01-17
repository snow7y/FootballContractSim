import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const testsDir = path.join(process.cwd(), 'tests');
const selfFile = path.join(testsDir, 'legacy-suite.test.ts');
const isWindows = process.platform === 'win32';
const tsxBin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  isWindows ? 'tsx.cmd' : 'tsx'
);

function listLegacyTests(): string[] {
  return fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith('.test.js') || file.endsWith('.test.ts'))
    .map((file) => path.join(testsDir, file))
    .filter((filePath) => filePath !== selfFile)
    .sort((a, b) => a.localeCompare(b));
}

function runTestFile(filePath: string): { status: number | null; stdout: string; stderr: string } {
  const isTypeScript = filePath.endsWith('.ts');
  const command = isTypeScript ? tsxBin : process.execPath;
  const args = isTypeScript ? [filePath] : [filePath];
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

for (const filePath of listLegacyTests()) {
  test(filePath.replace(`${testsDir}${path.sep}`, ''), () => {
    const result = runTestFile(filePath);
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    expect(result.status).toBe(0);
  });
}
