# CreativeOS MCP Server セットアップガイド

## 概要

CreativeOSのModel Context Protocol (MCP) サーバーは、CreativeOSの知識グラフを外部のAIアプリケーション（Claude Desktop等）から操作できるようにします。

## 機能

### Resources (リソース)
- `nodes://list` - 全ての知識ノードの一覧取得
- `nodes://search/{query}` - クエリによるノード検索

### Tools (ツール)
- `add_node` - 新しいノードの追加
- `update_node` - 既存ノードの更新
- `delete_node` - ノードの削除
- `search_nodes` - 高度なノード検索
- `generate_summary` - AI要約生成

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install @modelcontextprotocol/sdk zod
```

### 2. MCPサーバーの起動

#### 開発環境
```bash
npm run mcp:dev
```

#### 本番環境
```bash
npm run mcp
```

### 3. Claude Desktop での設定

Claude Desktop の設定ファイルに以下を追加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "creativeos": {
      "command": "node",
      "args": [
        "/path/to/CreativeOS/dist/server/server/mcp_server.js"
      ],
      "env": {}
    }
  }
}
```

**開発版（ts-node使用）**:
```json
{
  "mcpServers": {
    "creativeos": {
      "command": "npx",
      "args": [
        "ts-node",
        "--esm",
        "/path/to/CreativeOS/server/mcp_server.ts"
      ],
      "env": {}
    }
  }
}
```

### 4. 設定ファイルの確認

以下のコマンドで設定ファイルのパスを確認：

```bash
# macOS
echo "~/Library/Application Support/Claude/claude_desktop_config.json"

# Windows
echo "%APPDATA%\\Claude\\claude_desktop_config.json"
```

## 使用方法

### Claude Desktop での使用

Claude Desktop を再起動後、以下のようにMCPツールが使用できます：

#### ノード一覧の取得
```
全ての知識ノードを表示してください
```

#### ノードの追加
```
新しいノードを追加してください：
URL: https://example.com
コメント: 参考になるサイト
カテゴリ: 技術
タグ: ["web", "tutorial"]
```

#### ノードの検索
```
「技術」カテゴリのノードを検索してください
```

#### AI要約の生成
```
このテキストの要約を生成してください: [テキスト内容]
```

## API詳細

### add_node ツール

新しいノードを知識グラフに追加します。

**パラメータ**:
- `url` (string, required): 有効なURL
- `comment` (string, required): コメント
- `category` (string, optional): カテゴリ
- `tags` (array, optional): タグの配列

**例**:
```json
{
  "url": "https://example.com",
  "comment": "参考資料",
  "category": "技術",
  "tags": ["web", "development"]
}
```

### update_node ツール

既存のノードを更新します。

**パラメータ**:
- `id` (string, required): ノードID
- `comment` (string, optional): 新しいコメント
- `category` (string, optional): 新しいカテゴリ
- `tags` (array, optional): 新しいタグ

### delete_node ツール

ノードを削除します。

**パラメータ**:
- `id` (string, required): 削除するノードのID

### search_nodes ツール

高度な検索を実行します。

**パラメータ**:
- `query` (string, required): 検索クエリ
- `category` (string, optional): カテゴリフィルター
- `limit` (number, optional): 結果の最大数（デフォルト: 10）

### generate_summary ツール

AI要約を生成します。

**パラメータ**:
- `url` (string, optional): 要約するURL
- `text` (string, optional): 要約するテキスト
- `prompt` (string, optional): カスタムプロンプト

## トラブルシューティング

### MCPサーバーが起動しない

1. **依存関係の確認**:
   ```bash
   npm install
   ```

2. **DeepSeek APIの確認**:
   ```bash
   ollama list | grep deepseek
   ```

3. **ログの確認**:
   MCPサーバーのログを確認してエラーメッセージを確認してください。

### Claude Desktop でMCPツールが表示されない

1. **設定ファイルの場所を確認**
2. **JSON構文エラーをチェック**
3. **Claude Desktop を完全に再起動**
4. **パスが正しいことを確認**

### データファイルが見つからない

データファイル（`data/nodes.json`）が存在することを確認してください。存在しない場合は自動的に作成されます。

## セキュリティ考慮事項

- MCPサーバーはローカルファイルシステムにアクセスします
- 信頼できるクライアントからのみ接続を受け付けてください
- 本番環境では適切なアクセス制御を実装してください

## 開発者向け情報

### カスタムツールの追加

新しいツールを追加するには、`server/mcp_server.ts` に以下のパターンで追加：

```typescript
server.registerTool(
  "tool_name",
  {
    title: "Tool Title",
    description: "Tool description",
    inputSchema: {
      parameter: z.string().min(1, "Parameter is required")
    }
  },
  async ({ parameter }) => {
    // ツールの実装
    return {
      content: [{
        type: "text",
        text: "Result"
      }]
    };
  }
);
```

### リソースの追加

新しいリソースを追加するには：

```typescript
server.registerResource(
  "resource_name",
  "resource://uri-template",
  {
    name: "Resource Name",
    description: "Resource description",
    mimeType: "application/json"
  },
  async (uri) => {
    // リソースの実装
    return {
      contents: [{
        uri: uri.href,
        text: "Resource content"
      }]
    };
  }
);
```

## ライセンス

MIT License

## 参考リンク

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/download)