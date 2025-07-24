# DeepSeek-R1-0528モデルのセットアップガイド

## 概要
DeepSeek-R1-0528は、2024年5月28日版のDeepSeek推論モデルです。このガイドでは、CreativeOSでこのモデルを使用する方法を説明します。

## セットアップ方法

### 方法1: Ollama公式モデルを待つ（推奨）
最も簡単な方法は、OllamaがDeepSeek-R1-0528を公式にサポートするのを待つことです。

```bash
# 利用可能なモデルを確認
ollama list

# 新しいモデルを検索
ollama search deepseek
```

### 方法2: GGUF形式に変換して使用
HuggingFaceモデルをGGUF形式に変換してOllamaで使用します。

1. **必要なツールのインストール**
```bash
# Pythonの仮想環境を作成
python3 -m venv deepseek-env
source deepseek-env/bin/activate

# 必要なライブラリをインストール
pip install transformers torch accelerate
pip install llama-cpp-python
```

2. **モデルのダウンロード**
```bash
# HuggingFaceからモデルをダウンロード
huggingface-cli download deepseek-ai/DeepSeek-R1-0528 --local-dir ./deepseek-r1-0528
```

3. **GGUF形式への変換**
```bash
# llama.cppのconvert.pyを使用して変換
python convert.py ./deepseek-r1-0528 --outtype q4_0 --outfile deepseek-r1-0528.gguf
```

4. **Ollamaモデルファイルの作成**
```bash
# Modelfileを作成
cat > Modelfile << EOF
FROM ./deepseek-r1-0528.gguf

PARAMETER temperature 0.7
PARAMETER top_p 0.95
PARAMETER num_predict 4096

TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end▁of▁sentence|>{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end▁of▁sentence|>{{ end }}<|assistant|>
{{ .Response }}<|end▁of▁sentence|>"""
EOF

# Ollamaモデルを作成
ollama create deepseek-r1:0528 -f Modelfile
```

### 方法3: 代替APIエンドポイントを使用
HuggingFace Inference APIやローカルのvLLM/TGIサーバーを使用します。

1. **vLLMを使用したローカルサーバー**
```bash
# vLLMのインストール
pip install vllm

# モデルサーバーを起動
python -m vllm.entrypoints.openai.api_server \
    --model deepseek-ai/DeepSeek-R1-0528 \
    --port 8000 \
    --max-model-len 8192
```

2. **CreativeOSの設定を更新**
```typescript
// src/lib/api.ts を更新
const DEEPSEEK_ENDPOINT = process.env.DEEPSEEK_ENDPOINT || 'http://localhost:8000/v1/completions'

export async function generateWithDeepSeekR10528(prompt: string) {
  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-R1-0528',
      prompt,
      temperature: 0.7,
      max_tokens: 2048
    })
  })
  
  return response.json()
}
```

## CreativeOSでの設定

### 1. 環境変数の設定
`.env`ファイルに以下を追加：
```env
# DeepSeek-R1-0528の設定
DEEPSEEK_MODEL_NAME=deepseek-r1:0528
DEEPSEEK_API_ENDPOINT=http://localhost:11434/api/generate
```

### 2. モデル設定の更新
`src/store/model.ts`を更新：
```typescript
export const AVAILABLE_MODELS = [
  { id: 'deepseek-r1:0528', name: 'DeepSeek-R1 (0528)', description: '最新の推論特化モデル' },
  { id: 'deepseek-r1', name: 'DeepSeek-R1', description: '推論特化モデル' },
  // 他のモデル...
]
```

### 3. APIクライアントの更新
必要に応じて`src/lib/api.ts`でモデル名を調整：
```typescript
export async function generateSummary(url: string, text: string, modelId: string = 'deepseek-r1:0528') {
  // 実装...
}
```

## トラブルシューティング

### メモリ不足エラー
```bash
# GPUメモリを効率的に使用
CUDA_VISIBLE_DEVICES=0 ollama serve

# CPUのみで実行
OLLAMA_MODELS_PATH=/path/to/models ollama serve
```

### モデルが見つからない
```bash
# モデルリストを更新
ollama pull deepseek-r1:latest

# カスタムモデルパスを指定
export OLLAMA_MODELS=/custom/path
```

## パフォーマンス最適化

### 量子化オプション
- q4_0: 4ビット量子化（メモリ効率重視）
- q5_1: 5ビット量子化（バランス型）
- q8_0: 8ビット量子化（品質重視）
- f16: 16ビット浮動小数点（最高品質）

### 推奨設定
```yaml
# 高品質設定
temperature: 0.7
top_p: 0.95
num_predict: 4096
repeat_penalty: 1.1

# 高速設定
temperature: 0.3
top_p: 0.9
num_predict: 2048
repeat_penalty: 1.0
```

## 参考リンク
- [DeepSeek-R1-0528 HuggingFace](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528)
- [Ollama Documentation](https://ollama.ai/docs)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [vLLM Documentation](https://vllm.readthedocs.io/)