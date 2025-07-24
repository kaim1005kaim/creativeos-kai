import express from 'express';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

interface MCPServer {
  process?: ChildProcess;
  port: number;
  status: 'stopped' | 'starting' | 'running' | 'error';
  error?: string;
}

class EmbeddedMCPManager {
  private mcpServer: MCPServer = {
    port: 12306,
    status: 'stopped'
  };
  
  private mcpPath = join(process.cwd(), 'server');

  async checkMCPInstallation(): Promise<boolean> {
    return existsSync(join(this.mcpPath, 'simple_mcp_server.ts'));
  }

  async installMCP(): Promise<boolean> {
    try {
      console.log('🔄 Setting up Simple MCP server...');
      
      // Check if simple MCP server exists (it should already be in server directory)
      if (existsSync(join(this.mcpPath, 'simple_mcp_server.ts'))) {
        console.log('✅ Simple MCP server is ready');
        return true;
      } else {
        console.error('❌ Simple MCP server not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to setup MCP:', error);
      return false;
    }
  }

  async startMCPServer(): Promise<boolean> {
    try {
      if (this.mcpServer.status === 'running') {
        return true;
      }

      // Check if MCP is installed
      if (!await this.checkMCPInstallation()) {
        console.log('📦 MCP not found, installing...');
        const installed = await this.installMCP();
        if (!installed) {
          this.mcpServer.status = 'error';
          this.mcpServer.error = 'Failed to install MCP for Chrome';
          return false;
        }
      }

      console.log('🚀 Starting MCP server...');
      this.mcpServer.status = 'starting';

      // Start Simple MCP server
      const mcpProcess = spawn('npx', ['ts-node', '--esm', 'simple_mcp_server.ts'], {
        cwd: this.mcpPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      mcpProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`MCP: ${output}`);
        
        // Check if server is ready
        if (output.includes('Simple MCP server running') || output.includes('12306')) {
          this.mcpServer.status = 'running';
          console.log('✅ Simple MCP server is running');
        }
      });

      mcpProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        console.error(`MCP Error: ${error}`);
        
        if (error.includes('EADDRINUSE')) {
          // Port already in use - server might already be running
          this.checkMCPHealth().then(isHealthy => {
            if (isHealthy) {
              this.mcpServer.status = 'running';
              console.log('✅ Simple MCP server was already running');
            }
          });
        }
      });

      mcpProcess.on('close', (code) => {
        console.log(`MCP process exited with code ${code}`);
        this.mcpServer.status = 'stopped';
        this.mcpServer.process = undefined;
      });

      mcpProcess.on('error', (error) => {
        console.error('MCP process error:', error);
        this.mcpServer.status = 'error';
        this.mcpServer.error = error.message;
      });

      this.mcpServer.process = mcpProcess;

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Health check
      const isHealthy = await this.checkMCPHealth();
      if (isHealthy) {
        this.mcpServer.status = 'running';
        return true;
      } else {
        this.mcpServer.status = 'error';
        this.mcpServer.error = 'Server started but health check failed';
        return false;
      }

    } catch (error) {
      console.error('Failed to start MCP server:', error);
      this.mcpServer.status = 'error';
      this.mcpServer.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  async checkMCPHealth(): Promise<boolean> {
    try {
      const response = await axios.get('http://127.0.0.1:12306/health', {
        timeout: 3000
      });
      return response.status === 200;
    } catch {
      // Try alternative endpoint
      try {
        await axios.post('http://127.0.0.1:12306/mcp', {
          tool: 'ping',
          args: {}
        }, { timeout: 3000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  async stopMCPServer(): Promise<void> {
    if (this.mcpServer.process) {
      this.mcpServer.process.kill();
      this.mcpServer.process = undefined;
    }
    this.mcpServer.status = 'stopped';
  }

  getStatus() {
    return {
      ...this.mcpServer,
      installed: this.checkMCPInstallation()
    };
  }

  async restartMCPServer(): Promise<boolean> {
    await this.stopMCPServer();
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await this.startMCPServer();
  }
}

export const mcpManager = new EmbeddedMCPManager();

// Auto-start MCP server when this module is loaded
setTimeout(async () => {
  console.log('🔄 Auto-starting MCP server...');
  await mcpManager.startMCPServer();
}, 5000); // Wait 5 seconds after server start

export default mcpManager;