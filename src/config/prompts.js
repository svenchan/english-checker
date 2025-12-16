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
- テーマから逸れた箇所はPREPチェック内で必ず指摘すること。

`
    : "";
  
  return `${topicSection}生徒の英文: "${limitedText}"

出力仕様（JSONのみ、コードフェンス不可）:
- フォーマット: {"mistakes":[...],"overallScore":0-100,"topicFeedback":{...}}
- mistakes[].type ∈ {"grammar","vocabulary","spelling"}。誤りが無ければ []。
- topicFeedback = {
    "onTopicSummary": "テーマ適合を1-2文で要約（テーマが無ければ明記）",
    "prepChecklist": {
      "point": {...},
      "reason": {...},
      "evidence": {...},
      "pointSummary": {...}
    },
    "improvementTips": "PREP視点の追加助言"
  }
- prepChecklist 各項目は { "met": true/false, "note": "短い補足" } 形式。
- PREP（Point→Reason→Evidence→Point）順を守れているかを評価する

出力例（要約形でOK、必ず有効なJSON）:
{"mistakes":[{"original":"I go to school yesterday.","corrected":"I went to school yesterday.","explanation":"過去なので過去形。","type":"grammar"}],"overallScore":85,"topicFeedback":{"onTopicSummary":"テーマに沿って明確。","prepChecklist":{"point":{"met":true,"note":"主張あり"},"reason":{"met":true,"note":"理由提示"},"evidence":{"met":false,"note":"具体例不足"},"pointSummary":{"met":true,"note":"まとめあり"}},"improvementTips":"理由後に具体例を追加。"}}

必須ルール:
- 文法的に正しい英文は誤りにしない。指摘は文法/綴りのみで語彙提案は除外。
- JSON以外を出力しない。キー名は英語のまま、値は日本語で可。
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
