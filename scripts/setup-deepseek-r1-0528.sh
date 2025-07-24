#!/bin/bash

# DeepSeek-R1-0528モデルのセットアップスクリプト

echo "🚀 DeepSeek-R1-0528モデルのセットアップを開始します..."

# Ollamaが起動していることを確認
if ! pgrep -x "ollama" > /dev/null; then
    echo "❌ Ollamaが起動していません。先にOllamaを起動してください。"
    echo "コマンド: ollama serve"
    exit 1
fi

# 既存のdeepseek-r1モデルを削除（オプション）
echo "既存のdeepseek-r1モデルを削除しますか？ (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    ollama rm deepseek-r1:latest
fi

# カスタムModelfileを作成
cat > /tmp/Modelfile.deepseek-r1-0528 << 'EOF'
# DeepSeek-R1-0528モデルの設定

FROM deepseek-ai/DeepSeek-R1-0528

# モデルパラメータの設定
PARAMETER temperature 0.7
PARAMETER top_p 0.95
PARAMETER top_k 40
PARAMETER num_predict 4096
PARAMETER stop "<|end▁of▁sentence|>"
PARAMETER stop "<|endoftext|>"

# システムプロンプト（オプション）
SYSTEM """You are DeepSeek-R1-0528, a helpful AI assistant. You excel at reasoning, coding, and analysis. When thinking through problems, use <think> tags to show your reasoning process."""

# テンプレート設定
TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end▁of▁sentence|>{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end▁of▁sentence|>{{ end }}<|assistant|>
{{ .Response }}<|end▁of▁sentence|>"""
EOF

echo "📥 DeepSeek-R1-0528モデルをダウンロード中..."
echo "注意: このモデルは大きいため、ダウンロードに時間がかかる場合があります。"

# モデルを作成
ollama create deepseek-r1:0528 -f /tmp/Modelfile.deepseek-r1-0528

# 最新版としてタグ付け
ollama tag deepseek-r1:0528 deepseek-r1:latest

echo "✅ セットアップが完了しました！"
echo ""
echo "使用方法:"
echo "1. コマンドライン: ollama run deepseek-r1:0528"
echo "2. API: model名を 'deepseek-r1:0528' または 'deepseek-r1:latest' に設定"
echo ""
echo "CreativeOSでの使用:"
echo "- モデルセレクターで 'deepseek-r1' を選択"
echo "- 自動的に新しいモデルが使用されます"

# クリーンアップ
rm -f /tmp/Modelfile.deepseek-r1-0528

echo ""
echo "🎉 DeepSeek-R1-0528モデルの準備が整いました！"