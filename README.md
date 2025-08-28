# FootballContractSim

サッカー選手の契約シミュレーションゲーム

## 初回起動時

```powershell
docker compose build
docker compose up
```

### next not found が発生した場合

node_modulesが適切にインストールされていないのが原因

対処法:

1. compose.yamlファイルを次のように変更

```yaml
    # app の command行をコメントアウト 
    # command: sh -c "npm run dev"
```

2. コンテナの中に入り、依存関係をインストールする

```powershell
docker compose exec app bash

npm install
```

3. node_modulesが適切に作成されたのを確認した後、compose.yamlのコメントアウトした行を元に戻す

## 起動手順

```powershell
docker compose up
```
