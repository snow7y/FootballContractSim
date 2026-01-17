const path = require('node:path');
const { resolveTargets } = require('./test-execution/targetSelector');
const { validatePreflight } = require('./test-execution/preflight');
const { runLegacySuite } = require('./test-execution/legacySuiteHarness');
const { buildTestRunResult, formatResult } = require('./test-execution/resultReporter');

const KNOWN_MODES = ['local', 'ci'];
const KNOWN_OUTPUTS = ['human', 'json'];

function parseArgs(argv) {
  const targets = [];
  let mode;
  let output;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }

    if (arg.startsWith('--mode=')) {
      mode = arg.split('=')[1];
      continue;
    }

    if (arg === '--mode') {
      mode = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      output = arg.split('=')[1];
      continue;
    }

    if (arg === '--output') {
      output = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--area=')) {
      targets.push({ kind: 'area', value: arg.split('=')[1] });
      continue;
    }

    if (arg === '--area') {
      targets.push({ kind: 'area', value: argv[index + 1] });
      index += 1;
      continue;
    }

    if (arg.startsWith('--file=')) {
      targets.push({ kind: 'file', value: arg.split('=')[1] });
      continue;
    }

    if (arg === '--file') {
      targets.push({ kind: 'file', value: argv[index + 1] });
      index += 1;
      continue;
    }

    return { error: `未知のオプションです: ${arg}` };
  }

  return { mode, output, targets };
}

function usage() {
  return [
    'Usage: node scripts/test-execution.js [--mode local|ci] [--area <name>] [--file <path>] [--output human|json]',
    'Available modes: local, ci',
  ].join('\n');
}

function emitProgress({ index, total, filePath, format }) {
  const relative = path.relative(process.cwd(), filePath);
  const message = `Running ${index}/${total}: ${relative}`;
  if (format === 'json') {
    process.stderr.write(`${message}\n`);
    return;
  }
  process.stdout.write(`${message}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (args.error) {
    process.stderr.write(`${args.error}\n${usage()}\n`);
    process.exitCode = 1;
    return;
  }

  const mode = args.mode || process.env.TEST_RUN_MODE || 'local';
  const output = args.output || process.env.TEST_OUTPUT || 'human';

  if (!KNOWN_MODES.includes(mode)) {
    process.stderr.write(`Unknown mode: ${mode}\n${usage()}\n`);
    process.exitCode = 1;
    return;
  }

  if (!KNOWN_OUTPUTS.includes(output)) {
    process.stderr.write(`Unknown output: ${output}\n${usage()}\n`);
    process.exitCode = 1;
    return;
  }

  const rootDir = process.cwd();
  const testsDir = path.join(rootDir, 'tests');

  const preflight = validatePreflight({ testsDir, requireTsx: false, rootDir });
  if (!preflight.ok) {
    process.stderr.write(`${preflight.message}\n`);
    preflight.remedies.forEach((remedy) => process.stderr.write(`- ${remedy}\n`));
    process.exitCode = 1;
    return;
  }

  const request = {
    mode,
    targets: args.targets || [],
    output,
  };

  const resolution = resolveTargets(request, { testsDir, rootDir });
  if (resolution.error) {
    process.stderr.write(`${resolution.error.message}\n`);
    if (resolution.error.candidates && resolution.error.candidates.length > 0) {
      process.stderr.write('Candidates:\n');
      resolution.error.candidates.forEach((candidate) =>
        process.stderr.write(`- ${candidate}\n`),
      );
    }
    process.exitCode = 1;
    return;
  }

  const resolvedTargets = resolution.targets;
  const requiresTsx = resolvedTargets.some((filePath) => filePath.endsWith('.ts'));
  if (requiresTsx) {
    const tsxCheck = validatePreflight({ testsDir, requireTsx: true, rootDir });
    if (!tsxCheck.ok) {
      process.stderr.write(`${tsxCheck.message}\n`);
      tsxCheck.remedies.forEach((remedy) => process.stderr.write(`- ${remedy}\n`));
      process.exitCode = 1;
      return;
    }
  }

  if (resolvedTargets.length === 0) {
    process.stderr.write('実行対象のテストが見つかりませんでした。\n');
    process.exitCode = 1;
    return;
  }

  const results = runLegacySuite(resolvedTargets, {
    rootDir,
    output,
    onProgress: (progress) => emitProgress({ ...progress, format: output }),
  });

  const testRunResult = buildTestRunResult(results, { rootDir });
  const outputPayload = formatResult(testRunResult, output);
  if (output === 'json') {
    process.stdout.write(outputPayload);
  } else {
    process.stdout.write(outputPayload);
  }

  if (testRunResult.summary.failed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  parseArgs,
  usage,
  KNOWN_MODES,
  KNOWN_OUTPUTS,
};
