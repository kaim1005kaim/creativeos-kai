import React, { useState, useEffect } from 'react';

interface MCPStatus {
  status: 'stopped' | 'starting' | 'running' | 'error';
  port: number;
  error?: string;
  installed: boolean;
}

export const MCPController: React.FC = () => {
  const [mcpStatus, setMcpStatus] = useState<MCPStatus | null>(null);
  const fetchMCPStatus = async () => {
    try {
      const response = await fetch('/api/mcp/status');
      const status = await response.json();
      setMcpStatus(status);
    } catch (error) {
      console.error('Failed to fetch MCP status:', error);
    }
  };

  useEffect(() => {
    fetchMCPStatus();
    const interval = setInterval(fetchMCPStatus, 10000); // 10秒ごとに状態更新
    return () => clearInterval(interval);
  }, []);

  if (!mcpStatus) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#555',
        color: '#ccc',
        borderRadius: '6px',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '10px'
      }}>
        🔄 MCP状態を確認中...
      </div>
    );
  }

  const getStatusColor = () => {
    switch (mcpStatus.status) {
      case 'running': return '#4ecdc4';
      case 'starting': return '#feca57';
      case 'error': return '#ff6b6b';
      case 'stopped': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getStatusText = () => {
    switch (mcpStatus.status) {
      case 'running': return '🟢 MCP稼働中';
      case 'starting': return '🟡 起動中...';
      case 'error': return '🔴 エラー';
      case 'stopped': return '⚪ 停止中';
      default: return '❓ 不明';
    }
  };

  const getSubtext = () => {
    switch (mcpStatus.status) {
      case 'running': return 'ブラウザ自動化が利用可能';
      case 'starting': return '起動中...';
      case 'error': return `${mcpStatus.error || '不明なエラー'}`;
      case 'stopped': return '自動化機能は停止中';
      default: return '';
    }
  };

  return (
    <div style={{
      backgroundColor: '#2a2a2a',
      border: `2px solid ${getStatusColor()}`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {/* ステータス表示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: getStatusColor(),
            marginBottom: '4px'
          }}>
            {getStatusText()}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999'
          }}>
            {getSubtext()}
          </div>
        </div>
        
        <div style={{
          fontSize: '10px',
          color: '#666',
          textAlign: 'right'
        }}>
          Port: {mcpStatus.port}
        </div>
      </div>


      {/* エラー詳細のみ表示 */}
      {mcpStatus.status === 'error' && mcpStatus.error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#4d1a1a',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#ff6b6b'
        }}>
          <strong>❌ エラー:</strong> {mcpStatus.error}
        </div>
      )}
    </div>
  );
};