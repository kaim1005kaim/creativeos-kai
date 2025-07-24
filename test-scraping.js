import { scrapeXPost, scrapeXPostSimple } from './dist/server/server/x_scraper.js';

async function testScraping() {
    console.log('🚀 X投稿スクレイピングテストを開始...');
    
    const testUrl = 'https://x.com/openai/status/1234567890123456789';
    
    try {
        console.log('📄 フォールバック方式をテスト...');
        const simpleResult = await scrapeXPostSimple(testUrl);
        console.log('✅ フォールバック結果:', JSON.stringify(simpleResult, null, 2));
        
        console.log('\n🔍 Puppeteerスクレイピングをテスト...');
        const puppeteerResult = await scrapeXPost(testUrl);
        console.log('✅ Puppeteer結果:', JSON.stringify(puppeteerResult, null, 2));
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
        
        // フォールバックをテスト
        console.log('\n🔄 フォールバックをテスト...');
        try {
            const fallbackResult = await scrapeXPostSimple(testUrl);
            console.log('✅ フォールバック成功:', JSON.stringify(fallbackResult, null, 2));
        } catch (fallbackError) {
            console.error('❌ フォールバックも失敗:', fallbackError.message);
        }
    }
}

testScraping().then(() => {
    console.log('\n🎉 テスト完了');
    process.exit(0);
}).catch(error => {
    console.error('💥 テスト失敗:', error);
    process.exit(1);
});