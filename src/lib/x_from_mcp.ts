import { navigateToPage, extractContent, executeScript, waitForElement, checkMCPConnection } from "./mcp_client";
import type { XPostData } from "../types/XPostData";

// MCPを使用してX投稿データを取得
export async function fetchXPostDataViaMCP(url: string): Promise<XPostData> {
  console.log('Fetching X post data via MCP:', url);
  
  // MCP接続確認
  const isConnected = await checkMCPConnection();
  if (!isConnected) {
    throw new Error('MCP for Chrome is not running. Please start it first.');
  }

  try {
    // Xページに移動
    await navigateToPage(url);
    
    // 投稿が読み込まれるまで待機
    await waitForElement('article[data-testid="tweet"]', 10000);
    
    // 投稿データを抽出するJavaScriptを実行
    const extractScript = `
      (function() {
        const article = document.querySelector('article[data-testid="tweet"]');
        if (!article) return null;
        
        // 投稿者情報
        const authorElement = article.querySelector('[data-testid="User-Name"]');
        const usernameElement = article.querySelector('[data-testid="User-Name"] a');
        const avatarElement = article.querySelector('[data-testid="Tweet-User-Avatar"] img');
        
        // 投稿本文
        const textElement = article.querySelector('[data-testid="tweetText"]');
        
        // 投稿時間
        const timeElement = article.querySelector('time');
        
        // 画像
        const imageElements = article.querySelectorAll('[data-testid="tweetPhoto"] img');
        
        // 動画
        const videoElement = article.querySelector('video');
        
        // 投稿ID（URLから抽出）
        const tweetId = window.location.pathname.split('/status/')[1]?.split('?')[0];
        
        return {
          id: tweetId || '',
          url: window.location.href,
          author: {
            name: authorElement?.textContent?.split('@')[0]?.trim() || '',
            username: usernameElement?.getAttribute('href')?.replace('/', '') || '',
            avatarUrl: avatarElement?.src || ''
          },
          text: textElement?.textContent || '',
          images: Array.from(imageElements).map(img => img.src).slice(0, 4),
          videoUrl: videoElement?.src || undefined,
          createdAt: timeElement?.getAttribute('datetime') || new Date().toISOString()
        };
      })();
    `;
    
    const postData = await executeScript(extractScript);
    
    if (!postData || !postData.id) {
      throw new Error('Failed to extract tweet data from page');
    }
    
    console.log('Extracted X post data:', postData);
    return postData as XPostData;
    
  } catch (error) {
    console.error('Error fetching X post via MCP:', error);
    
    // フォールバック: 基本的な情報のみ抽出
    const fallbackData: XPostData = {
      id: url.split('/status/')[1]?.split('?')[0] || Date.now().toString(),
      url,
      author: {
        name: '',
        username: 'unknown',
        avatarUrl: ''
      },
      text: 'MCP経由での投稿取得に失敗しました',
      images: [],
      createdAt: new Date().toISOString()
    };
    
    return fallbackData;
  }
}

// より堅牢な抽出（複数の方法を試行）
export async function fetchXPostDataViaMCPRobust(url: string): Promise<XPostData> {
  console.log('Fetching X post data via MCP (robust):', url);
  
  const isConnected = await checkMCPConnection();
  if (!isConnected) {
    throw new Error('MCP for Chrome is not running');
  }

  try {
    await navigateToPage(url);
    
    // 複数のセレクターで投稿を待機
    const selectors = [
      'article[data-testid="tweet"]',
      'article[role="article"]',
      '[data-testid="tweetText"]'
    ];
    
    let article = null;
    for (const selector of selectors) {
      try {
        await waitForElement(selector, 5000);
        article = await extractContent(selector);
        if (article) break;
      } catch {
        continue;
      }
    }
    
    // 段階的にデータを抽出
    const extractionSteps = [
      // Step 1: 基本情報
      async () => {
        const script = `
          const tweetId = window.location.pathname.split('/status/')[1]?.split('?')[0];
          const url = window.location.href;
          return { id: tweetId, url };
        `;
        return await executeScript(script);
      },
      
      // Step 2: 投稿者情報
      async () => {
        const script = `
          const article = document.querySelector('article[data-testid="tweet"], article[role="article"]');
          if (!article) return {};
          
          const authorName = article.querySelector('[data-testid="User-Name"]')?.textContent?.split('@')[0]?.trim();
          const username = article.querySelector('[data-testid="User-Name"] a')?.getAttribute('href')?.replace('/', '');
          const avatar = article.querySelector('[data-testid="Tweet-User-Avatar"] img, img[alt*="profile"]')?.src;
          
          return {
            author: {
              name: authorName || '',
              username: username || 'unknown',
              avatarUrl: avatar || ''
            }
          };
        `;
        return await executeScript(script);
      },
      
      // Step 3: 投稿内容
      async () => {
        const script = `
          const article = document.querySelector('article[data-testid="tweet"], article[role="article"]');
          if (!article) return {};
          
          const textElement = article.querySelector('[data-testid="tweetText"], [lang]');
          const text = textElement?.textContent || textElement?.innerText || '';
          
          return { text };
        `;
        return await executeScript(script);
      },
      
      // Step 4: メディア情報
      async () => {
        const script = `
          const article = document.querySelector('article[data-testid="tweet"], article[role="article"]');
          if (!article) return {};
          
          const images = Array.from(article.querySelectorAll('[data-testid="tweetPhoto"] img, img[src*="media"]'))
            .map(img => img.src)
            .filter(src => src && !src.includes('avatar'))
            .slice(0, 4);
          
          const video = article.querySelector('video')?.src;
          
          return { 
            images,
            videoUrl: video || undefined
          };
        `;
        return await executeScript(script);
      },
      
      // Step 5: 投稿時間
      async () => {
        const script = `
          const timeElement = document.querySelector('time[datetime], time');
          const datetime = timeElement?.getAttribute('datetime') || timeElement?.title;
          
          return {
            createdAt: datetime || new Date().toISOString()
          };
        `;
        return await executeScript(script);
      }
    ];
    
    // 各ステップを実行して結果をマージ
    let result: Partial<XPostData> = {};
    for (const step of extractionSteps) {
      try {
        const stepResult = await step();
        result = { ...result, ...stepResult };
      } catch (error) {
        console.warn('Extraction step failed:', error);
      }
    }
    
    // デフォルト値で補完
    const finalData: XPostData = {
      id: result.id || Date.now().toString(),
      url: result.url || url,
      author: {
        name: result.author?.name || '',
        username: result.author?.username || 'unknown',
        avatarUrl: result.author?.avatarUrl || ''
      },
      text: result.text || 'テキストの取得に失敗しました',
      images: result.images || [],
      videoUrl: result.videoUrl,
      createdAt: result.createdAt || new Date().toISOString()
    };
    
    console.log('Robust extraction result:', finalData);
    return finalData;
    
  } catch (error) {
    console.error('Robust extraction failed:', error);
    throw error;
  }
}

// X投稿URLの妥当性チェック
export function validateXPostUrl(url: string): boolean {
  const xUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
  return xUrlPattern.test(url);
}

// MCPステータス確認
export async function getMCPStatus(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const connected = await checkMCPConnection();
    return { connected };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}