/**
 * AI Prompt Templates
 */

const SYSTEM_MESSAGE = "あなたは日本の中学生に英語を教える優しい先生です。必ずJSON形式で回答してください。文法的に正しい英文は間違いにしないでください。";

function buildCheckPrompt(text) {
  return `生徒の英文: "${text}"

以下のJSON形式で返してください：
{
  "mistakes": [
    {
      "original": "間違った部分",
      "corrected": "正しい英語",
      "explanation": "ルールを2〜3文で説明。繰り返さない。",
      "tip": "次回気をつけるポイント",
      "type": "grammar|vocabulary|spelling"
    }
  ],
  "overallScore": 0-100,
  "goodPoints": ["良い点1", "良い点2"]
}

注意：
- 文法エラーのみ指摘、スタイル・表現の好みは無視
- 完璧な英文はmistakesを空にし、100点
- tipは具体的に
- 中学生向け日本語でわかりやすく書く

必ずJSONのみを返してください。`;
}

const GROQ_SETTINGS = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.5,
  max_tokens: 2500,
  response_format: { type: "json_object" }
};

module.exports = {
  SYSTEM_MESSAGE,
  buildCheckPrompt,
  GROQ_SETTINGS
};
