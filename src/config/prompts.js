// AI Prompt Template for strict JSON-only feedback

// CHANGED: Shortened from 60+ characters to ~40 characters
// Saves ~5-10 tokens per request
export const SYSTEM_MESSAGE = "日本の中学生向け英作文チェッカー。JSON形式で回答。文法的に正しい英文は絶対に間違いとしない。文法エラーと綴りミスのみ訂正。";

// CHANGED: Balanced prompt - educational but not too verbose
// Emphasizes clear explanations with grammar rules
export function buildCheckPrompt(text, topicText = null) {
  // NEW: Limit input to 500 characters to prevent huge prompts
  const limitedText = text.slice(0, 500);
  
  // Optional: Log if text was truncated
  if (text.length > 500) {
    console.warn(`Input truncated: ${text.length} → 500 characters`);
  }

  const topicSection = topicText
    ? `指定トピック: "${topicText}"
- 学生はこの題材を意識して英文を書きました。テーマから外れていないかを必ず確認し、PREPの観点でコメントしてください。

`
    : "";
  
  return `${topicSection}生徒の英文: "${limitedText}"

出力仕様（JSONオブジェクトのみ、他の文字・コードフェンス不可）:
- keys: mistakes(array), overallScore(number: 0-100), topicFeedback(object)
- mistakes[].type は "grammar" | "vocabulary" | "spelling" のいずれか
- ミスがなければ mistakes は [] にする
- topicFeedback には以下のフィールドを含める:
  {
    "onTopicSummary": "テーマに沿って書けているか、外れている場合はどう直すかを1-2文で説明（テーマが無ければそれを明記）",
    "prepChecklist": {
      "point": { "met": true/false, "note": "P: 主張に対する評価や例" },
      "reason": { "met": true/false, "note": "R: 理由の説明" },
      "evidence": { "met": true/false, "note": "E: 具体例の有無" },
      "pointSummary": { "met": true/false, "note": "P(まとめ): まとめの評価" }
    },
    "improvementTips": "PREPの観点で改善するための追加アドバイス。"
  }
- PREP（Point→Reason→Evidence→Point）の流れに沿って、学生の回答がテーマに上手く答えているかを評価する

出力例（値は例。必ず有効なJSONで返す）:
{
  "mistakes": [
    {
      "original": "I go to school yesterday.",
      "corrected": "I went to school yesterday.",
      "explanation": "過去の出来事なので動詞は過去形にします。",
      "type": "grammar"
    }
  ],
  "overallScore": 85,
  "topicFeedback": {
    "onTopicSummary": "テーマに沿っており、自己紹介が明確でした。",
    "prepChecklist": {
      "point": { "met": true, "note": "私はテニスが好きです。と主張できています。" },
      "reason": { "met": true, "note": "好きな理由も述べています。" },
      "evidence": { "met": false, "note": "具体例が不足しています。" },
      "pointSummary": { "met": true, "note": "まとめがあります。" }
    },
    "improvementTips": "理由の後に具体例を増やすと説得力が上がります。"
  }
}

厳守ルール:
1. 文法的に正しい英文は間違いとして出力しない
2. 指摘は文法エラーと綴りミスのみ
3. 内容の追加・変更、語彙の言い換え、より自然な表現提案は mistakes に含めない

注意:
- JSON以外の文字列やコードフェンスは出力しない
- 値は日本語で構いませんが、キー名は必ず上記英語のまま
`;
}

export const GROQ_SETTINGS = {
  model: "llama-3.3-70b-versatile",
  // CHANGED: Reduced from 0.5 to 0.3
  // Lower temperature = more consistent, focused responses
  temperature: 0.2,
  // CHANGED: Increased to 1200 to allow for educational explanations
  // Still prevents extreme spikes but allows detailed grammar explanations
  // Typical response: 400-800 tokens
  max_tokens: 600,
  response_format: { type: "json_object" }
};

// NEW: Helper function to log token usage
// Use this in your API call to monitor usage patterns
export function logTokenUsage(response, inputText) {
  const usage = response.usage;
  console.log('📊 Token Usage:', {
    prompt: usage.prompt_tokens,
    completion: usage.completion_tokens,
    total: usage.total_tokens,
    inputLength: inputText.length,
    efficiency: `${(usage.total_tokens / inputText.length).toFixed(2)} tokens/char`
  });
}
