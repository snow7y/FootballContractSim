// テスト実行サービスの失敗検証用ファイル

(function main() {
  if (process.env.TEST_EXECUTION_FORCE_FAILURE === '1') {
    console.error('forced failure requested');
    process.exitCode = 1;
    return;
  }

  console.log('test-execution-failure.test.js passed (default).');
})();
