// MCP for Chrome クライアント (APIサーバー経由)
const MCP_ENDPOINT = "/api/mcp-proxy";

export interface MCPResponse<T = any> {
  result?: T;
  error?: string;
}

export async function postToMCP(tool: string, args: any): Promise<any> {
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ tool, args }),
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
    }

    const json: MCPResponse = await response.json();
    
    if (json.error) {
      throw new Error(`MCP error: ${json.error}`);
    }
    
    return json.result || json;
  } catch (error) {
    console.error('MCP Client error:', error);
    throw error;
  }
}

// MCP接続確認
export async function checkMCPConnection(): Promise<boolean> {
  try {
    // MCP状態をAPIサーバー経由で確認
    const response = await fetch('/api/mcp/status', { 
      method: "GET",
      signal: AbortSignal.timeout(3000) // 3秒でタイムアウト
    });
    
    if (!response.ok) {
      return false;
    }
    
    const status = await response.json();
    return status.status === 'running';
  } catch {
    return false;
  }
}

// 特定のページに移動
export async function navigateToPage(url: string): Promise<void> {
  await postToMCP("navigate", { url });
}

// セレクターで要素を抽出
export async function extractContent(selector: string): Promise<string> {
  return await postToMCP("extract_content", { selector });
}

// JavaScript実行
export async function executeScript(script: string): Promise<any> {
  return await postToMCP("execute_script", { script });
}

// スクリーンショット取得
export async function takeScreenshot(): Promise<string> {
  return await postToMCP("screenshot", {});
}

// 要素をクリック
export async function clickElement(selector: string): Promise<void> {
  await postToMCP("click", { selector });
}

// テキスト入力
export async function typeText(selector: string, text: string): Promise<void> {
  await postToMCP("type", { selector, text });
}

// 要素が表示されるまで待機
export async function waitForElement(selector: string, timeout = 10000): Promise<void> {
  await postToMCP("wait_for_element", { selector, timeout });
}