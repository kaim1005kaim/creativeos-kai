import React, { useState } from 'react';
import { getMCPStatus } from '../lib/x_from_mcp';

export const QuickMCPSetup: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const executeQuickSetup = async () => {
    setIsExecuting(true);
    setOutput('');
    setError('');

    try {
      // ユーザーの Downloads フォルダにセットアップ
      const setupPath = '~/Downloads/mcp-chrome';
      
      setOutput('🚀 MCP for Chrome の高速セットアップを開始します...\n');

      const commands = [
        {
          cmd: `cd ~/Downloads && git clone https://github.com/hangwin/mcp-chrome || echo "Already cloned"`,
          desc: 'リポジトリをダウンロード中'
        },
        {
          cmd: `cd ${setupPath} && npm install`,
          desc: '依存関係をインストール中'
        }
      ];

      for (const { cmd, desc } of commands) {
        setOutput(prev => prev + `🔄 ${desc}...\n`);
        
        const response = await fetch('/api/execute-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            command: cmd.replace('~', process.env.HOME || '/tmp'),
            description: desc 
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setOutput(prev => prev + `✅ ${desc} 完了\n`);
        } else {
          throw new Error(result.error);
        }
      }

      setOutput(prev => prev + `
🎉 セットアップ完了！

次のステップ:
1. ターミナルを開く
2. 以下のコマンドを実行:
   cd ~/Downloads/mcp-chrome
   npm run dev

3. MCPサーバーが起動したら X投稿のノード化が可能になります！
`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`❌ セットアップに失敗しました: ${errorMsg}`);
      setOutput(prev => prev + `\n❌ エラー: ${errorMsg}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const checkConnection = async () => {
    const status = await getMCPStatus();
    if (status.connected) {
      setOutput('✅ MCP for Chrome が正常に動作しています！');
      setError('');
    } else {
      setError('❌ MCPサーバーに接続できません。npm run dev を実行してください。');
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🚀 MCP高速セットアップ</h3>
        <button
          onClick={checkConnection}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
        >
          接続確認
        </button>
      </div>

      <p className="text-gray-300 text-sm">
        X投稿の自動ノード化に必要な MCP for Chrome を簡単セットアップ
      </p>

      <div className="flex space-x-2">
        <button
          onClick={executeQuickSetup}
          disabled={isExecuting}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isExecuting 
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isExecuting ? '⏳ セットアップ中...' : '🚀 ワンクリックセットアップ'}
        </button>
        
        <button
          onClick={() => window.open('https://github.com/hangwin/mcp-chrome', '_blank')}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
        >
          📖 詳細情報
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-600 rounded p-3">
          <p className="text-red-200 text-sm">{error}</p>
          <div className="mt-2 text-xs text-red-300">
            <strong>手動セットアップ:</strong><br/>
            ターミナルで以下を実行してください:<br/>
            <code className="bg-black px-1 py-0.5 rounded">
              git clone https://github.com/hangwin/mcp-chrome && cd mcp-chrome && npm install && npm run dev
            </code>
          </div>
        </div>
      )}

      {output && (
        <div className="bg-black border border-gray-600 rounded p-3">
          <h4 className="text-white text-sm font-medium mb-2">実行ログ:</h4>
          <pre className="text-green-400 text-xs whitespace-pre-wrap overflow-x-auto">
            {output}
          </pre>
        </div>
      )}

      <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
        <h4 className="text-blue-200 text-sm font-medium mb-1">💡 使用方法:</h4>
        <ol className="text-blue-200 text-xs space-y-1 list-decimal list-inside">
          <li>上記のセットアップを完了</li>
          <li>「新しいノードを追加」でX URLを入力</li>
          <li>「MCP for Chrome を使用」にチェック ✅</li>
          <li>ログイン状態で投稿内容を自動取得</li>
        </ol>
      </div>
    </div>
  );
};