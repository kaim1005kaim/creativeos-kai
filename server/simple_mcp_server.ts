import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { launch, Browser, Page } from 'puppeteer';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

class SimpleMCPServer {
  private server: Server;
  private browser: Browser | null = null;
  private currentPage: Page | null = null;
  private httpServer: express.Application;

  constructor() {
    this.server = new Server(
      {
        name: 'CreativeOS-MCP-Simple',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.httpServer = express();
    this.httpServer.use(cors());
    this.httpServer.use(express.json());
    this.setupRoutes();
    this.setupHandlers();
  }

  private setupRoutes() {
    // Health check endpoint
    this.httpServer.get('/health', (req, res) => {
      res.json({ status: 'healthy', server: 'CreativeOS-MCP-Simple' });
    });

    // Main MCP endpoint
    this.httpServer.post('/mcp', async (req, res) => {
      try {
        const { tool, args } = req.body;
        
        if (!tool || !args) {
          return res.status(400).json({ error: 'Missing tool or args' });
        }

        const result = await this.executeTool(tool, args);
        res.json({ result });
      } catch (error) {
        console.error('MCP tool execution error:', error);
        res.status(500).json({ 
          error: 'Tool execution failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.executeTool(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools() {
    return [
      {
        name: 'navigate',
        description: 'Navigate to a URL in the browser',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to navigate to',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'execute_script',
        description: 'Execute JavaScript in the current page',
        inputSchema: {
          type: 'object',
          properties: {
            script: {
              type: 'string',
              description: 'The JavaScript code to execute',
            },
          },
          required: ['script'],
        },
      },
      {
        name: 'extract_content',
        description: 'Extract text content from the current page',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to extract content from (optional)',
            },
          },
        },
      },
    ];
  }

  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      try {
        console.log('🚀 Launching browser...');
        
        const puppeteerOptions: any = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
          timeout: 10000,
        };

        // macOSでGoogle Chromeを使用
        if (process.platform === 'darwin') {
          const chromePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/opt/homebrew/bin/chromium'
          ];
          
          const fs = await import('fs');
          for (const path of chromePaths) {
            if (fs.existsSync(path)) {
              puppeteerOptions.executablePath = path;
              console.log('Using browser at:', path);
              break;
            }
          }
        }

        console.log('Browser options:', puppeteerOptions);
        this.browser = await launch(puppeteerOptions);
        console.log('✅ Browser launched successfully');
      } catch (error) {
        console.error('❌ Failed to launch browser:', error);
        throw error;
      }
    }

    if (!this.currentPage) {
      try {
        console.log('Creating new page...');
        this.currentPage = await this.browser.newPage();
        
        await this.currentPage.setViewport({ width: 1920, height: 1080 });
        await this.currentPage.setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        
        console.log('✅ Page created successfully');
      } catch (error) {
        console.error('❌ Failed to create page:', error);
        throw error;
      }
    }
  }

  private async executeTool(name: string, args: any): Promise<any> {
    try {
      await this.ensureBrowser();
    } catch (error) {
      console.warn('Browser initialization failed, using fallback mode:', error.message);
      // ブラウザが使用できない場合のフォールバック
      return this.executeToolFallback(name, args);
    }

    switch (name) {
      case 'navigate':
        if (!args.url) {
          throw new Error('URL is required for navigate tool');
        }
        await this.currentPage!.goto(args.url, { waitUntil: 'networkidle0', timeout: 30000 });
        return { success: true, url: args.url };

      case 'execute_script':
        if (!args.script) {
          throw new Error('Script is required for execute_script tool');
        }
        const result = await this.currentPage!.evaluate(args.script);
        return { result };

      case 'extract_content':
        if (args.selector) {
          const element = await this.currentPage!.$(args.selector);
          if (element) {
            const text = await element.evaluate((el) => el.textContent);
            return { content: text };
          } else {
            return { content: null, error: 'Selector not found' };
          }
        } else {
          const content = await this.currentPage!.content();
          return { content };
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async executeToolFallback(name: string, args: any): Promise<any> {
    console.log(`Executing tool in fallback mode: ${name}`);
    
    switch (name) {
      case 'navigate':
        if (!args.url) {
          throw new Error('URL is required for navigate tool');
        }
        return { success: true, url: args.url, fallback: true, message: 'Browser not available' };

      case 'execute_script':
        if (!args.script) {
          throw new Error('Script is required for execute_script tool');
        }
        return { result: null, fallback: true, message: 'Browser not available' };

      case 'extract_content':
        return { content: null, fallback: true, message: 'Browser not available' };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async start(port: number = 12306): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer.listen(port, '127.0.0.1', () => {
          console.log(`✅ Simple MCP server running on http://127.0.0.1:${port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.currentPage = null;
    }
  }
}

export default SimpleMCPServer;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SimpleMCPServer();
  server.start().catch(console.error);
  
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
}