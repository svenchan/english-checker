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
    };

    const apiKey = apiKeyMap[classCode.toUpperCase()];

    if (!apiKey) {
      return res.status(401).json({ error: '無効なクラスコードです' });
    }

    // 🔽 NEW OPTIMIZED PROMPT 🔽
    const prompt = `
あなたは英語の文法チェッカーです。以下の英文を分析し、明らかな誤り（文法・スペル・句読点）のみ指摘してください。
英語は米国英語（American English）のスペリングを基準とします。
英国英語の単語（lift, flat, holiday など）は正しい語として認めますが、
スペルが英国式（colour, centre, favourite など）の場合は誤りとして指摘してください。

例：
- colour → color
- centre → center
- organise → organize
- lift → OK
- flat → OK

出力は次のJSON形式のみで返してください。

{
  "mistakes": [
    {
      "original": "間違っている部分",
      "type": "grammar" | "spelling" | "punctuation",
      "explanation": "なぜ間違いなのか。中学生にも分かる日本語で説明。ただし文法用語（例：時制、冠詞、主語など）は使ってよい。",
      "hint": "正しい形を考えるためのヒント（正解は書かない）"
    }
  ],
  "overallScore": 0〜100,
  "goodPoints": ["特に問題のない文や要素（あれば）"]
}

条件：
- JSON以外の文章は出力しない。
- explanationとhintは1文以内。
- 明確な文法・スペル・句読点ミスのみ指摘する。
- 米国式スペルを基準とし、英国式スペル（colourなど）は誤りとする。
- 語彙の違い（lift, flatなど）は誤りとしない。
- 誤りがなければmistakesは空配列にし、overallScoreは100にする。

生徒の英文: "${text}"
`;

    // Send to Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
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

    return res.status(200).json(parsedFeedback);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'サーバーエラーが発生しました',
      details: error.message
    });
  }
}
