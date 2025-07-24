import React, { useState, useEffect } from 'react';
import { getMCPStatus } from '../lib/x_from_mcp';
import { MCPSetupWizard } from './MCPSetupWizard';

export const MCPSetupButton: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await getMCPStatus();
        setIsConnected(status.connected);
      } catch {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // 30秒ごとにチェック
    return () => clearInterval(interval);
  }, []);

  if (checking) {
    return (
      <div style={{
        width: '100%',
        padding: '12px',
        backgroundColor: '#555',
        color: '#ccc',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '10px'
      }}>
        🔄 MCP接続状態を確認中...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div style={{
        width: '100%',
        padding: '12px',
        backgroundColor: '#4ecdc4',
        color: '#000',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🟢 MCP for Chrome 接続済み
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          X投稿の自動取得が利用可能
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#ff6b6b',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#ff5252';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ff6b6b';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        🔴 MCP for Chrome をセットアップ
        <span style={{ fontSize: '12px', opacity: 0.9 }}>
          X投稿の自動取得に必要
        </span>
      </button>

      {showWizard && (
        <MCPSetupWizard onClose={() => setShowWizard(false)} />
      )}
    </>
  );
};