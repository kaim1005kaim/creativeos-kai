# CreativeOS × MCP for Chrome 連携ガイド

## 🎯 概要

MCP for Chrome を活用してCreativeOSでX（旧Twitter）投稿を自動的にノード化します。ログイン状態を保持したまま、ブラウザ経由で投稿内容を取得できます。

## ✅ 実現する機能

- ✅ X投稿URLからログイン済みブラウザ経由で投稿内容を抽出
- ✅ 投稿本文、画像、投稿者名、投稿日などを自動取得
- ✅ DeepSeek-R1-0528で要約・ベクトル化 → ノード生成
- ✅ リアルタイムMCP接続状態表示
- ✅ フォールバック機能（MCP失敗時は従来のPuppeteer使用）

## 🛠 セットアップ手順

### 方法1: UI上でのワンクリックセットアップ（推奨）

1. **CreativeOS を起動**
2. **ダッシュボードタブ** に移動
3. **MCP for Chrome 連携** カードで **🚀 ワンクリックセットアップ** をクリック
4. 自動でダウンロード・インストールが完了
5. ターミナルで `cd ~/Downloads/mcp-chrome && npm run dev` を実行

### 方法2: 手動セットアップ

```bash
# MCP for Chrome をクローン
git clone https://github.com/hangwin/mcp-chrome
cd mcp-chrome

# 依存関係をインストール
npm install

# 開発サーバーを起動（ポート12306）
npm run dev
```

### 3. CreativeOS での確認

1. 右上のMCP接続状態を確認
   - 🟢 **MCP接続済み** = 利用可能
   - 🔴 **MCP未接続** → **セットアップ** ボタンをクリック

### 4. X投稿ノード作成

1. **新しいノードを追加** をクリック
2. X投稿のURLを貼り付け（例：`https://x.com/username/status/123456789`）
3. **MCP for Chrome を使用してX投稿を取得** にチェック ✅
4. コメントを入力して **ノードを追加**

## 🔧 技術仕様

### MCPクライアント実装

**`src/lib/mcp_client.ts`**
```typescript
const MCP_ENDPOINT = "http://127.0.0.1:12306/mcp";

export async function postToMCP(tool: string, args: any): Promise<any> {
  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  return response.json();
}
```

### X投稿データ抽出

**`src/lib/x_from_mcp.ts`**
```typescript
export async function fetchXPostDataViaMCPRobust(url: string): Promise<XPostData> {
  await navigateToPage(url);
  await waitForElement('article[data-testid=\"tweet\"]', 10000);
  
  const postData = await executeScript(`
    const article = document.querySelector('article[data-testid=\"tweet\"]');
    return {
      id: window.location.pathname.split('/status/')[1]?.split('?')[0],
      author: {
        name: article?.querySelector('[data-testid=\"User-Name\"]')?.textContent,
        username: article?.querySelector('[data-testid=\"User-Name\"] a')?.getAttribute('href'),
        avatarUrl: article?.querySelector('[data-testid=\"Tweet-User-Avatar\"] img')?.src
      },
      text: article?.querySelector('[data-testid=\"tweetText\"]')?.textContent,
      images: Array.from(article?.querySelectorAll('[data-testid=\"tweetPhoto\"] img')),
      createdAt: article?.querySelector('time')?.getAttribute('datetime')
    };
  `);
  
  return postData;
}
```

### サーバーAPI拡張

**`server/deepseek_api.ts`**
```typescript
app.post('/api/x-post', async (req, res) => {
  const { url, useMCP = false } = req.body;
  
  if (useMCP) {
    try {
      const mcpResponse = await axios.post('http://127.0.0.1:12306/mcp', {
        tool: 'navigate',
        args: { url }
      });
      // MCP経由で投稿内容を抽出
    } catch (mcpError) {
      // フォールバック: Puppeteer使用
    }
  }
});
```

## 🎮 使用方法

### 基本的な流れ

1. **MCP for Chrome 起動確認**
   ```bash
   cd mcp-chrome
   npm run dev
   ```

2. **CreativeOS でX投稿ノード作成**
   - URL: `https://x.com/elonmusk/status/1234567890`
   - コメント: 「興味深いツイート」
   - ✅ MCP for Chrome を使用してX投稿を取得

3. **自動処理フロー**
   - MCP → Chromeでページ移動
   - DOM要素から投稿データ抽出
   - DeepSeek-R1-0528で要約生成
   - ベクトル化してノード作成

### MCP接続状態の確認

**UI表示例:**
```
🟢 MCP接続済み    [🔄]
🔴 MCP未接続      [🔄]  ⚠️
🔄 チェック中...
```

## 🔍 トラブルシューティング

### 1. MCP接続エラー
```
❌ MCP for Chrome is not running
```
**解決方法:**
- MCP for Chrome が起動していることを確認
- ポート12306が使用可能か確認
- `npm run dev` でMCPサーバーを再起動

### 2. X投稿取得失敗
```
❌ Failed to extract tweet data from page
```
**解決方法:**
- Xにログインしているか確認
- 投稿が削除されていないか確認
- フォールバック機能でPuppeteerが動作

### 3. フォールバック動作
MCPが失敗した場合、自動的に従来のPuppeteerスクレイピングにフォールバックします。

## 📊 利点

### MCP for Chrome の利点
- ✅ **ログイン状態保持**: ブラウザのセッションをそのまま使用
- ✅ **リアルタイム抽出**: DOMから直接データ取得
- ✅ **高い成功率**: ブラウザ環境でのネイティブ動作
- ✅ **メディア対応**: 画像・動画の正確な取得

### 従来のPuppeteerとの比較
| 機能 | MCP for Chrome | Puppeteer |
|------|----------------|-----------|
| ログイン状態 | ✅ 保持 | ❌ 毎回必要 |
| 設定の簡単さ | ✅ 簡単 | ⚠️ 複雑 |
| リソース使用量 | ✅ 軽量 | ❌ 重い |
| 成功率 | ✅ 高い | ⚠️ 中程度 |

## 🚀 高度な使用例

### バッチ処理
```javascript
const xUrls = [
  'https://x.com/user1/status/123',
  'https://x.com/user2/status/456',
  'https://x.com/user3/status/789'
];

for (const url of xUrls) {
  await addNode(url, '自動収集', { useMCP: true });
}
```

### カスタムフィルタリング
```javascript
// 特定のキーワードを含む投稿のみ処理
if (postData.text.includes('AI') || postData.text.includes('機械学習')) {
  await addNode(url, 'AI関連投稿', { useMCP: true });
}
```

## 🔗 関連リンク

- [MCP for Chrome GitHub](https://github.com/hangwin/mcp-chrome)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [CreativeOS MCP Server](./MCP_SETUP.md)

## 📝 注意事項

- MCP for Chrome は開発版のため、安定性に注意
- X/Twitter の利用規約を遵守してください
- 大量の投稿取得時はレート制限に注意
- プライベートアカウントの投稿は取得できません