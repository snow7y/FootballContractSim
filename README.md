# FootballContractSim

サッカー選手の契約シミュレーションゲーム

## 初回起動時

```powershell
docker compose build
docker compose up

# Error response from daemon: error while mounting volume というエラーが発生した場合は空のnode_modulesを作成してから再度実行
mkdir node_modules
docker compose up
```

[localhost:3000](http://localhost:3000)にアクセスすると、アプリケーションが表示される。

## 起動手順

```powershell
docker compose up
```

## 開発時

DevContainerを使用して開発を想定。
[Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)をインストールし、このリポジトリを開いて開発する。

### 理由

node_modulesがコンテナ内に作成されるため、ホスト側のnode_modulesと同期が取れず、依存関係の解決に問題が生じる可能性がある。
また、エディタ側で使用するLinterやFormatterが正しく動作しないことがある。（例: page.tsxなどのファイルでモジュールが見つかりません。のようなエラーが発生する）
DevContainerを使用することで、開発環境をコンテナ内に統一し、依存関係の問題を回避できる。
