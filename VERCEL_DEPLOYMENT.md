# Vercel Deployment Guide for CreativeOS

## Prerequisites
- Vercel account
- GitHub repository connected to Vercel

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 2. Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `kaim1005kaim/creativeos-kai`

### 3. Configure Environment Variables
In Vercel project settings, add the following environment variable:
- `DEEPSEEK_API_KEY`: Your DeepSeek API key (sk-7a36628f15fc4f0b883071fbedaae7e0)

### 4. Deploy
Click "Deploy" and Vercel will automatically build and deploy your application.

## Project Structure for Vercel

```
/
├── api/                 # Serverless functions
│   ├── summary.ts      # Summary generation endpoint
│   ├── title.ts        # Title generation endpoint
│   ├── extract-tags.ts # Tag extraction endpoint
│   ├── embedding.ts    # Embedding generation endpoint
│   ├── nodes.ts        # Node data management
│   └── ogp.ts          # OGP metadata fetching
├── dist/               # Built frontend files
├── src/                # Frontend source code
├── vercel.json         # Vercel configuration
└── package.json        # Dependencies and scripts
```

## API Endpoints
All API endpoints are automatically deployed as serverless functions:
- `/api/summary` - Generate content summary
- `/api/title` - Generate content title
- `/api/extract-tags` - Extract tags and categories
- `/api/embedding` - Generate embeddings
- `/api/nodes` - Manage node data
- `/api/ogp` - Fetch OGP metadata

## Notes
- X (Twitter) post fetching uses multiple fallback methods:
  - FixTweet API (fxtwitter.com) - Most reliable, returns JSON
  - Nitter instances - Privacy-focused Twitter frontend
  - Twitter oEmbed API - Official but limited
- MCP (Model Context Protocol) features are not available in Vercel deployment
- Embeddings use dummy values in Vercel deployment (consider using a real embedding service)
- Node data is stored in the `/data` directory (consider using a database for production)

## Troubleshooting
- If deployment fails, check the Vercel deployment logs
- Ensure all environment variables are properly set
- Check that the API key is valid and has sufficient quota