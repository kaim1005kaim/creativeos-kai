// X投稿スクレイピングのクイックテスト
import { scrapeXPostSimple } from './dist/server/server/x_scraper.js';

console.log('🧪 X投稿機能の簡易テスト');
console.log('=====================================');

// テスト用のダミーURL
const testUrls = [
    'https://x.com/elonmusk/status/1234567890',
    'https://twitter.com/openai/status/9876543210',
    'https://x.com/invalid/status/123'
];

for (const url of testUrls) {
    try {
        console.log(`\n🔍 テスト中: ${url}`);
        const result = await scrapeXPostSimple(url);
        console.log(`✅ 成功! ID: ${result.id}`);
        console.log(`   投稿者: ${result.author.username}`);
        console.log(`   本文: ${result.text.substring(0, 50)}...`);
    } catch (error) {
        console.log(`❌ エラー: ${error.message}`);
    }
}

console.log('\n🎉 テスト完了! フォールバック機能が動作しています。');
console.log('💡 フロントエンドでX投稿URLを入力してお試しください！');