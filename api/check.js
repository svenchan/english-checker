export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, classCode } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'テキストが必要です' });
    }

    if (!classCode) {
      return res.status(400).json({ error: 'クラスコードが必要です' });
    }

    // Map class codes to API keys (add more classes as needed)
    const apiKeyMap = {
      'CLASS21': process.env.GROQ_API_KEY_21,
      'CLASS22': process.env.GROQ_API_KEY_22,
      'CLASS23': process.env.GROQ_API_KEY_23,
      // Add more classes here as needed
    };

    const apiKey = apiKeyMap[classCode.toUpperCase()];

    if (!apiKey) {
      return res.status(401).json({ error: '無効なクラスコードです' });
    }

    const prompt = `あなたは日本の中学生に英語を教える優しい先生です。

生徒が書いた英文: "${text}"

この英文をチェックして、以下のJSON形式で返してください：

{
  "mistakes": [
    {
      "original": "間違っている部分の原文",
      "corrected": "正しい英語",
      "explanation": "なぜ間違っているかの詳しい説明（2〜3文で説明）",
      "tip": "次回から気をつけるポイント",
      "type": "grammar" または "vocabulary" または "spelling"
    }
  ],
  "overallScore": 0から100の数字,
  "goodPoints": ["よくできている点1", "よくできている点2"]
}

重要な注意点：

【explanationの書き方】
- 必ず2〜3文で詳しく説明してください
- 「なぜ」間違っているのかを説明してください
- 単に正しい形を言うだけではなく、理由を説明してください
- 中学生にわかりやすい日本語で書いてください
- 文法用語を使う場合は、簡単に説明を加えてください

【良い例】
間違い: "I like watch soccer"
悪い説明: "動詞にing" ← これはダメ！理由がない
良い説明: "「〜することが好き」と言いたいときは、likeの後に動詞のing形を使います。watchをwatchingにする必要があります。"

間違い: "He go to school"
悪い説明: "goesにする" ← これもダメ！
良い説明: "主語がHe, She, Itのときは、動詞にsをつけます。だからgoではなくgoesにしなければいけません。"

【tipの書き方】
- 次回から気をつけられるような具体的なアドバイスを書いてください
- 「〜に注意しましょう」「〜を覚えておきましょう」のような形で

【スコアの付け方】
- 完璧な英文は100点
- 間違い1個ごとに10-20点減点してください
- 間違いがない場合は、スコアを100にしてください
- 間違いがある場合は、スコアを必ず100未満にしてください

【その他】
- 中学生レベルの英語に基づいて評価してください
- 小さなミスも見逃さず指摘してください
- 間違いがない場合は、mistakes配列を空にして、goodPointsにポジティブなコメントを入れてください

必ずJSONのみを返してください。他のテキストは含めないでください。`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "あなたは日本の中学生に英語を教える優しい先生です。必ずJSON形式で回答してください。explanationは必ず2〜3文で詳しく書いてください。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Groq API error');
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content;
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const parsedFeedback = JSON.parse(responseText);
    
    // Validate and fix the response
    if (!parsedFeedback.mistakes) {
      parsedFeedback.mistakes = [];
    }
    
    if (!parsedFeedback.goodPoints) {
      parsedFeedback.goodPoints = [];
    }
    
    // Ensure all mistakes have required fields
    parsedFeedback.mistakes = parsedFeedback.mistakes.map(mistake => ({
      original: mistake.original || "",
      corrected: mistake.corrected || "",
      explanation: mistake.explanation || "説明がありません",
      tip: mistake.tip || "もう一度確認してみましょう",
      type: mistake.type || "grammar"
    }));
    
    // Fix scoring logic: if there are mistakes but score is 100, recalculate
    if (parsedFeedback.mistakes.length > 0 && parsedFeedback.overallScore >= 100) {
      parsedFeedback.overallScore = Math.max(0, 100 - (parsedFeedback.mistakes.length * 15));
    }
    
    // If no mistakes but score is 0, set to 100
    if (parsedFeedback.mistakes.length === 0 && parsedFeedback.overallScore < 80) {
      parsedFeedback.overallScore = 100;
    }
    
    return res.status(200).json(parsedFeedback);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      details: error.message 
    });
  }
}
