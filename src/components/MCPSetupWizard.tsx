import React, { useState } from 'react';

interface MCPSetupWizardProps {
  onClose: () => void;
}

export const MCPSetupWizard: React.FC<MCPSetupWizardProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const executeCommand = async (command: string, description: string) => {
    setIsExecuting(true);
    setCommandOutput(prev => prev + `\n🔄 ${description}...\n`);
    
    try {
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, description })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCommandOutput(prev => prev + `✅ ${description} 完了\n${result.output}\n`);
      } else {
        setCommandOutput(prev => prev + `❌ ${description} 失敗\n${result.error}\n`);
        setError(result.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setCommandOutput(prev => prev + `❌ エラー: ${errorMsg}\n`);
      setError(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  const runAutoSetup = async () => {
    setCommandOutput('🚀 MCP for Chrome 自動セットアップを開始します...\n');
    setError('');
    
    const commands = [
      {
        command: 'git clone https://github.com/hangwin/mcp-chrome /tmp/mcp-chrome-setup',
        description: 'MCP for Chrome をダウンロード中'
      },
      {
        command: 'cd /tmp/mcp-chrome-setup && npm install',
        description: '依存関係をインストール中'
      },
      {
        command: 'cd /tmp/mcp-chrome-setup && npm run build',
        description: 'MCPサーバーをビルド中'
      }
    ];

    for (const { command, description } of commands) {
      await executeCommand(command, description);
      if (error) break;
    }

    if (!error) {
      setCommandOutput(prev => prev + '\n🎉 セットアップ完了！次のステップに進んでください。\n');
      setStep(3);
    }
  };

  const startMCPServer = async () => {
    await executeCommand(
      'cd /tmp/mcp-chrome-setup && npm run dev',
      'MCPサーバーを起動中'
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">MCP for Chrome セットアップウィザード</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center mb-6">
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= stepNum ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > stepNum ? 'bg-green-500' : 'bg-gray-600'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">ステップ 1: 要件確認</h3>
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-white mb-2">必要な環境:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>✅ Node.js v18以上</li>
                <li>✅ Git</li>
                <li>✅ インターネット接続</li>
                <li>✅ 約50MBの空き容量</li>
              </ul>
            </div>
            <div className="bg-blue-900/50 p-4 rounded">
              <h4 className="font-semibold text-blue-200 mb-2">これから実行すること:</h4>
              <ol className="text-blue-200 space-y-1 list-decimal list-inside">
                <li>MCP for Chrome をGitHubからダウンロード</li>
                <li>依存関係をインストール</li>
                <li>MCPサーバーをビルド</li>
                <li>開発サーバーを起動</li>
              </ol>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                手動セットアップ
              </button>
              <button
                onClick={runAutoSetup}
                disabled={isExecuting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                {isExecuting ? '実行中...' : '自動セットアップ開始'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">ステップ 2: 手動セットアップ</h3>
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-white mb-2">ターミナルで以下のコマンドを実行してください:</h4>
              <div className="bg-black p-3 rounded text-green-400 font-mono text-sm">
                <div>$ git clone https://github.com/hangwin/mcp-chrome</div>
                <div>$ cd mcp-chrome</div>
                <div>$ npm install</div>
                <div>$ npm run dev</div>
              </div>
            </div>
            <div className="bg-yellow-900/50 p-4 rounded">
              <p className="text-yellow-200">
                💡 <strong>ヒント:</strong> 最後の <code>npm run dev</code> コマンドを実行すると、
                MCPサーバーがポート12306で起動します。
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                完了 → 次へ
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">ステップ 3: 動作確認</h3>
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-white mb-2">接続テスト:</h4>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://127.0.0.1:12306/mcp', {
                      method: 'GET',
                      signal: AbortSignal.timeout(3000)
                    });
                    if (response.ok) {
                      setCommandOutput('✅ MCP for Chrome が正常に動作しています！');
                      setError('');
                    } else {
                      setError('❌ MCPサーバーからの応答が異常です');
                    }
                  } catch (err) {
                    setError('❌ MCPサーバーに接続できません。npm run dev が実行されているか確認してください。');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                🔍 接続テスト実行
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 p-4 rounded">
                <h4 className="font-semibold text-red-200 mb-2">エラー:</h4>
                <p className="text-red-200">{error}</p>
                <div className="mt-2">
                  <button
                    onClick={startMCPServer}
                    disabled={isExecuting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    {isExecuting ? '起動中...' : 'MCPサーバーを起動'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-green-900/50 p-4 rounded">
              <h4 className="font-semibold text-green-200 mb-2">🎉 セットアップ完了！</h4>
              <p className="text-green-200 mb-2">
                これで CreativeOS でX投稿を自動的にノード化できます。
              </p>
              <ul className="text-green-200 space-y-1 list-disc list-inside">
                <li>「新しいノードを追加」でX URLを入力</li>
                <li>「MCP for Chrome を使用」にチェック</li>
                <li>ログイン状態で投稿内容を自動取得</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                戻る
              </button>
              <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                完了
              </button>
            </div>
          </div>
        )}

        {/* コマンド出力表示 */}
        {commandOutput && (
          <div className="mt-6">
            <h4 className="font-semibold text-white mb-2">実行ログ:</h4>
            <div className="bg-black p-3 rounded text-green-400 font-mono text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
              {commandOutput}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};