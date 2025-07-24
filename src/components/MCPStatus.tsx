import React, { useState, useEffect } from 'react';
import { getMCPStatus } from '../lib/x_from_mcp';
import { MCPSetupWizard } from './MCPSetupWizard';
import { QuickMCPSetup } from './QuickMCPSetup';

interface MCPStatusProps {
  className?: string;
}

export const MCPStatus: React.FC<MCPStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    error?: string;
    checking?: boolean;
  }>({ connected: false, checking: true });
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  const checkStatus = async () => {
    setStatus({ connected: false, checking: true });
    try {
      const result = await getMCPStatus();
      setStatus({ connected: result.connected, error: result.error, checking: false });
    } catch (error) {
      setStatus({ 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        checking: false
      });
    }
  };

  useEffect(() => {
    checkStatus();
    
    // 30秒ごとに自動チェック
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (status.checking) return 'text-yellow-400';
    return status.connected ? 'text-green-400' : 'text-red-400';
  };

  const getStatusText = () => {
    if (status.checking) return 'チェック中...';
    if (status.connected) return 'MCP接続済み';
    return 'MCP未接続';
  };

  const getStatusIcon = () => {
    if (status.checking) return '🔄';
    return status.connected ? '🟢' : '🔴';
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm">
          {getStatusIcon()}
        </span>
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {!status.checking && (
          <button
            onClick={checkStatus}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="接続状態を再確認"
          >
            🔄
          </button>
        )}
        {!status.connected && !status.checking && (
          <button
            onClick={() => setShowSetupWizard(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            title="MCPセットアップを開始"
          >
            セットアップ
          </button>
        )}
        {status.error && (
          <div className="text-xs text-red-400" title={status.error}>
            ⚠️
          </div>
        )}
      </div>
      
      {showSetupWizard && (
        <MCPSetupWizard onClose={() => setShowSetupWizard(false)} />
      )}
    </>
  );
};

export const MCPStatusCard: React.FC = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    error?: string;
    checking?: boolean;
  }>({ connected: false, checking: true });

  const checkStatus = async () => {
    setStatus({ connected: false, checking: true });
    try {
      const result = await getMCPStatus();
      setStatus({ connected: result.connected, error: result.error, checking: false });
    } catch (error) {
      setStatus({ 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        checking: false
      });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-medium mb-3">MCP for Chrome 連携</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">接続状態</span>
          <MCPStatus />
        </div>
        
        {status.error && (
          <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
            <strong>エラー:</strong> {status.error}
          </div>
        )}
        
        {!status.connected && !status.checking && (
          <QuickMCPSetup />
        )}
        
        {status.connected && (
          <div className="text-xs text-green-400 bg-green-900/20 p-2 rounded">
            ✅ X投稿の自動取得が利用可能です
          </div>
        )}
      </div>
    </div>
  );
};