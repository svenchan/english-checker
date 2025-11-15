
// * AI Prompt Templates - Optimized Version


// CHANGED: Shortened from 60+ characters to ~40 characters
// Saves ~5-10 tokens per request
const SYSTEM_MESSAGE = "日本の中学生向け英作文チェッカー。JSON形式で回答。文法的に正しい英文は絶対に間違いとしない。文法エラーと綴りミスのみ訂正。日本語のみで回答。";

// CHANGED: Balanced prompt - educational but not too verbose
// Emphasizes clear explanations with grammar rules
function buildCheckPrompt(text) {
  // NEW: Limit input to 500 characters to prevent huge prompts
  const limitedText = text.slice(0, 500);
  
  // Optional: Log if text was truncated
  if (text.length > 500) {
    console.warn(`Input truncated: ${text.length} → 500 characters`);
  }
  
  return `生徒の英文: "${limitedText}"

以下のJSON形式で返してください：
{
  "mistakes": [
    {
      "original": "間違った部分",
      "corrected": "正しい英語",
      "explanation": "なぜ間違いか、どの文法ルールに関係するか（例：英語は主語+動詞の順番、be動詞が必要、など）を1〜2文で説明",
      "type": "grammar|vocabulary|spelling"
    }
  ],
  "overallScore": 0-100,
  "levelUp": "より自然な表現と内容の追加や変更の提案のコメント"
}

【絶対に守るルール】
1. 文法的に正しい英文は絶対に間違いとしない
2. 綴りミスと明確な文法エラーのみを指摘
3. 語彙の置き換えは絶対にしない（例：「good」→「excellent」は禁止）
4. スタイルや言い回しの改善は絶対にしない

explanationでは文法ルールを明確に説明（例：「英語は主語+動詞の構造」「be動詞が必要」など）
level upでは、より自然な表現や情報の付け加えの例を提案するが、提案は必ず難しい単語使わない。
完璧な英文はmistakes空配列、100点

JSONのみ返してください。`;
}

const GROQ_SETTINGS = {
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
function logTokenUsage(response, inputText) {
  const usage = response.usage;
  console.log('📊 Token Usage:', {
    prompt: usage.prompt_tokens,
    completion: usage.completion_tokens,
    total: usage.total_tokens,
    inputLength: inputText.length,
    efficiency: `${(usage.total_tokens / inputText.length).toFixed(2)} tokens/char`
  });
}


module.exports = {
  SYSTEM_MESSAGE,
  buildCheckPrompt,
  GROQ_SETTINGS,
  logTokenUsage  // NEW: Export the logging helper
};
