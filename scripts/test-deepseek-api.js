import axios from 'axios';

async function testDeepSeekAPI() {
  const apiKey = 'sk-7a36628f15fc4f0b883071fbedaae7e0';
  const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

  try {
    console.log('Testing DeepSeek API...');
    
    const response = await axios.post(apiUrl, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'あなたは有用なアシスタントです。簡潔で情報豊富な要約を日本語で生成してください。'
        },
        {
          role: 'user',
          content: 'こんにちは。APIが正常に動作しているかテストしています。'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('Success! API Response:');
    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

testDeepSeekAPI();