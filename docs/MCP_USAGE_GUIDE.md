# MCP for Chrome 使用ガイド

## 現在の状況について

スクリーンショットを確認すると、**MCP for Chrome を使用してX投稿を取得** のチェックボックスが無効化（グレーアウト）されています。これは **MCP for Chrome がまだ起動していない** ためです。

## 📋 使用手順（ステップバイステップ）

### ステップ 1: MCP for Chrome をセットアップ

#### 方法A: ダッシュボードからワンクリックセットアップ
1. **ダッシュボードタブ** をクリック
2. **MCP for Chrome 連携** カードを探す
3. **🚀 ワンクリックセットアップ** ボタンをクリック
4. 自動ダウンロード・インストールを待つ

#### 方法B: 手動セットアップ
ターミナルで以下を実行：
```bash
git clone https://github.com/hangwin/mcp-chrome
cd mcp-chrome
npm install
```

### ステップ 2: MCP サーバーを起動

ターミナルで以下を実行：
```bash
cd mcp-chrome  # (またはダウンロードしたフォルダ)
npm run dev
```

成功すると以下のような表示が出ます：
```
🚀 MCP Server running on port 12306
```

### ステップ 3: 接続確認

CreativeOS画面で以下を確認：
- 右上の状態表示が 🟢 **MCP接続済み** になる
- MCPチェックボックスが有効化される

### ステップ 4: X投稿をノード化

1. **新しいノードを追加** をクリック
2. X投稿URLを貼り付け（例：`https://x.com/username/status/123456789`）
3. ✅ **MCP for Chrome を使用してX投稿を取得** にチェック（有効化されている）
4. コメントを入力
5. **ノードを追加** をクリック

## 🔍 トラブルシューティング

### チェックボックスが無効のまま
**原因**: MCP for Chrome が起動していない
**解決方法**:
```bash
# ターミナルで確認
ps aux | grep node  # MCPプロセスが動いているか確認
curl http://127.0.0.1:12306/mcp  # 接続テスト
```

### MCPサーバーが起動しない
**原因**: ポート12306が使用中
**解決方法**:
```bash
# ポート使用状況を確認
lsof -i :12306
# 必要に応じてプロセスを終了
kill -9 [PID]
```

### X投稿取得に失敗
**原因**: Xにログインしていない、または投稿が削除済み
**解決方法**:
1. ブラウザでX.comにログイン
2. 投稿URLが正しいか確認
3. フォールバック機能で自動的にPuppeteerが実行される

## 🚀 実際の使用例

### 例1: 技術系ツイートをノード化
```
URL: https://x.com/elonmusk/status/1234567890
コメント: 「AIについての興味深い投稿」
✅ MCP for Chrome を使用 (チェック)
→ 投稿内容、画像、投稿者情報を自動取得
```

### 例2: 複数投稿の一括処理
```
1. URL入力 → MCP取得 → ノード追加
2. URL入力 → MCP取得 → ノード追加
3. URL入力 → MCP取得 → ノード追加
→ すべてログイン状態で確実に取得
```

## 📊 MCP vs 従来のPuppeteer比較

| 機能 | MCP for Chrome | Puppeteer |
|------|----------------|-----------|
| ログイン状態 | ✅ 保持 | ❌ 毎回必要 |
| 取得成功率 | ✅ 高い | ⚠️ 中程度 |
| 設定の簡単さ | ✅ 簡単 | ❌ 複雑 |
| リソース使用量 | ✅ 軽量 | ❌ 重い |

## 💡 ヒント

1. **常時起動**: MCPサーバーをバックグラウンドで常時起動しておくと便利
2. **ログイン維持**: ブラウザでXにログインした状態を保つ
3. **エラー時フォールバック**: MCP失敗時は自動でPuppeteerが動作
4. **接続状態確認**: 右上の🟢/🔴インジケーターで状態を常に確認

## ⚙️ 詳細設定

### MCPサーバーのカスタマイズ
```bash
# 環境変数でポート変更
PORT=12307 npm run dev

# デバッグモード
DEBUG=* npm run dev
```

### CreativeOS設定
```typescript
// カスタムMCPエンドポイント
const MCP_ENDPOINT = "http://127.0.0.1:12307/mcp";
```

## 🎯 まとめ

**現在の状況**: MCPサーバーが起動していないため、チェックボックスが無効化されています。

**解決手順**:
1. `git clone https://github.com/hangwin/mcp-chrome`
2. `cd mcp-chrome && npm install && npm run dev`
3. CreativeOSで🟢表示を確認
4. X URLでMCPチェックボックスを有効化
5. ログイン状態でX投稿を自動ノード化