// パフォーマンステスト実行スクリプト
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadTestData(size) {
  const filename = path.join(__dirname, '../data', `test-nodes-${size}.json`);
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data);
}

async function testAPIPerformance(testData, testName) {
  console.log(`\n=== ${testName} Performance Test ===`);
  console.log(`Testing with ${testData.length} nodes`);
  
  try {
    // 1. ノードデータ保存テスト
    const saveStart = performance.now();
    const response = await fetch('http://localhost:3001/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const saveEnd = performance.now();
    
    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }
    
    console.log(`✅ Save: ${(saveEnd - saveStart).toFixed(2)}ms`);
    
    // 2. ノードデータ読み込みテスト  
    const loadStart = performance.now();
    const loadResponse = await fetch('http://localhost:3001/api/nodes');
    const loadedData = await loadResponse.json();
    const loadEnd = performance.now();
    
    console.log(`✅ Load: ${(loadEnd - loadStart).toFixed(2)}ms`);
    console.log(`📊 Loaded ${loadedData.length} nodes`);
    
    // 3. 埋め込み生成テスト（サンプル）
    const embeddingStart = performance.now();
    const embeddingResponse = await fetch('http://localhost:8001/embedding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Sample text for embedding test' })
    });
    const embeddingData = await embeddingResponse.json();
    const embeddingEnd = performance.now();
    
    console.log(`✅ Embedding: ${(embeddingEnd - embeddingStart).toFixed(2)}ms`);
    
    // 4. AI要約生成テスト（サンプル）
    const summaryStart = performance.now();
    const summaryResponse = await fetch('http://localhost:3001/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: 'https://example.com', 
        comment: 'Performance test comment',
        modelId: 'deepseek'
      })
    });
    const summaryData = await summaryResponse.json();
    const summaryEnd = performance.now();
    
    console.log(`✅ AI Summary: ${(summaryEnd - summaryStart).toFixed(2)}ms`);
    
    return {
      nodeCount: testData.length,
      saveTime: saveEnd - saveStart,
      loadTime: loadEnd - loadStart,
      embeddingTime: embeddingEnd - embeddingStart,
      summaryTime: summaryEnd - summaryStart
    };
    
  } catch (error) {
    console.error(`❌ ${testName} test failed:`, error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 CreativeOS Performance Testing Suite');
  console.log('==========================================');
  
  const sizes = ['small', 'medium', 'large', 'xlarge'];
  const results = [];
  
  for (const size of sizes) {
    try {
      const testData = await loadTestData(size);
      const result = await testAPIPerformance(testData, size.toUpperCase());
      if (result) {
        results.push(result);
      }
      
      // テスト間の休憩
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to load test data for ${size}:`, error.message);
    }
  }
  
  // 結果サマリー
  console.log('\n📊 Performance Summary');
  console.log('======================');
  console.log('Nodes\t| Save(ms)\t| Load(ms)\t| Embed(ms)\t| AI(ms)');
  console.log('------|-----------|-----------|-----------|----------');
  
  results.forEach(result => {
    console.log(`${result.nodeCount}\t| ${result.saveTime.toFixed(1)}\t\t| ${result.loadTime.toFixed(1)}\t\t| ${result.embeddingTime.toFixed(1)}\t\t| ${result.summaryTime.toFixed(1)}`);
  });
  
  // パフォーマンス警告
  const largeResults = results.find(r => r.nodeCount >= 500);
  if (largeResults) {
    console.log('\n⚠️  Performance Warnings:');
    if (largeResults.loadTime > 1000) {
      console.log('- Load time >1s detected. Consider implementing pagination.');
    }
    if (largeResults.saveTime > 2000) {
      console.log('- Save time >2s detected. Consider batch processing.');
    }
  }
  
  console.log('\n✅ Performance testing completed!');
}

// メイン実行
runAllTests().catch(console.error);