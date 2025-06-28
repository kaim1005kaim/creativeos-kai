# CreativeOS

CreativeOSは、AI-Powered Knowledge Graph Visualization システムです。ブックマークURLとコメントからノードを生成し、要約・ベクトル化・関連ノード接続を行い、Three.jsで3D空間に視覚化します。

## 🌟 Features (フェーズ1完了)

- **🔍 ファジー検索**: fuse.jsによる高精度なノード検索
- **✏️ ノード編集**: ダブルクリックでモーダル編集、要約再生成
- **🎛️ フィルタリング**: モデル別・日時・関連度でノードをフィルタ
- **🎨 色分け表示**: デフォルト・モデル別・日時・関連度・ドメイン別で視覚化
- **🤖 LLMモデル切替**: DeepSeek-R1・Hunyuan-A13B対応
- **🌐 3D可視化**: Three.jsによるインタラクティブな知識グラフ

## 🚀 機能

- **ブックマーク管理**: URLとコメントの入力・保存
- **自動要約**: DeepSeek-R1による日本語要約生成
- **意味ベクトル化**: sentence-transformersによるローカル埋め込み
- **関連性発見**: cosine類似度による自動ノード接続
- **3D可視化**: Three.jsによるインタラクティブなノード表示
- **モバイル対応**: Tailscaleを使ったリモートアクセス

## 📋 必要な環境

### 必須ソフトウェア
- Node.js 18+
- Python 3.8+
- DeepSeek-R1 (Ollama経由)
- Tailscale (リモートアクセス用)

### Python依存パッケージ
```bash
pip install flask flask-cors sentence-transformers torch
```

### Ollama設定
```bash
# DeepSeek-R1モデルのインストール
ollama pull deepseek-r1

# APIサーバー起動
ollama serve
```

## 🔧 セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境設定
`.env`ファイルを編集して、TailscaleのIPアドレスを設定:
```bash
TAILSCALE_IP=100.x.x.x  # 実際のTailscale IPに置き換え
```

### 3. サーバー起動

#### 埋め込みAPIサーバー
```bash
npm run embedding
# または
python server/embedding_api.py
```

#### メインAPIサーバー
```bash
npm run server
# または
ts-node server/deepseek_api.ts
```

#### フロントエンド開発サーバー
```bash
npm run dev
```

## 🌐 Tailscaleによるリモートアクセス

### Mac Studio側の設定
```bash
# Tailscaleをインストール
brew install tailscale

# Tailscaleサービスを開始
sudo tailscale up

# IPアドレスを確認
tailscale ip -4
```

### スマートフォン側の設定
1. Tailscaleアプリをインストール
2. 同じアカウントでログイン
3. ブラウザで `http://100.x.x.x:3000` にアクセス

## 📱 使用方法

1. **ノード追加**: サイドバーのフォームにURLとコメントを入力
2. **自動処理**: DeepSeek-R1が要約を生成、埋め込みベクトルを計算
3. **関連性検出**: 既存ノードとの類似度を計算し、自動で接続線を描画
4. **3D表示**: Three.jsキャンバスでノードとその関係を視覚化
5. **ノード選択**: ノードをクリックして詳細を確認

## 🔧 API エンドポイント

### メインAPI (http://localhost:3001)
- `GET /api/nodes` - 全ノードの取得
- `POST /api/nodes` - ノード保存
- `POST /api/summary` - DeepSeek-R1による要約生成

### 埋め込みAPI (http://localhost:8000)
- `POST /embedding` - テキストの意味ベクトル生成
- `GET /health` - API状態確認

## 📊 技術スタック

- **フロントエンド**: React, TypeScript, Three.js, Zustand
- **バックエンド**: Express, Python Flask
- **AI/ML**: DeepSeek-R1 (Ollama), sentence-transformers
- **ビルドツール**: Vite
- **ネットワーク**: Tailscale VPN

## 🔄 開発ロードマップ

- [x] 基本的なノード生成・表示機能
- [x] DeepSeek-R1統合
- [x] 埋め込みベクトル生成
- [x] 関連性に基づく自動接続
- [ ] OGP画像の自動取得・表示
- [ ] フィルタリング・検索機能
- [ ] タイムライン表示
- [ ] クラスタリング可視化
- [ ] CSVインポート/エクスポート

## 🤝 貢献

プロジェクトへの貢献を歓迎します。Issueの報告やPull Requestをお気軽にお送りください。

## 📄 ライセンス

MIT License