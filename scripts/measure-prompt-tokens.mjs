#!/usr/bin/env node
/**
 * Measure Groq reasoning vs completion tokens for a fixed fixture set.
 * Mirrors the check API: SYSTEM_MESSAGE + buildCheckPrompt → Groq →
 * validateAndFixResponse → applyFeedbackPolicy.
 *
 * Usage:
 *   GROQ_API_KEY_11=... node scripts/measure-prompt-tokens.mjs
 *   # or with .env.local in the repo root
 *
 * Optional:
 *   LABEL=baseline  COMPARE_TO=artifacts/prompt-measure-baseline.json
 *   REASONING_EFFORT=low|medium|high  PASS_REASONING_EFFORT=0
 *   TEMPERATURE=0.5  SEED=42  PASS_SEED=0
 *   SYSTEM_VARIANT=baseline_ja|en_rules|en_rules_no_punct
 *
 * Recommended A/B order (one change at a time):
 *   0) PASS_REASONING_EFFORT=0 LABEL=baseline-medium
 *   0b) reasoning_effort=low LABEL=effort-low
 *   1) TEMPERATURE=0.5 LABEL=temp-0.5
 *   2) SEED=42 LABEL=seed-42
 *   3) SYSTEM_VARIANT=en_rules LABEL=en-rules
 *   4) SYSTEM_VARIANT=en_rules_no_punct LABEL=en-no-punct
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MAIN_REPO = resolve(ROOT, "..", "english-checker");

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return false;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
  return true;
}

function loadEnvLocal() {
  // Prefer worktree .env.local, then main checkout (user may drop the key there).
  loadEnvFile(resolve(ROOT, ".env.local")) ||
    loadEnvFile(resolve(MAIN_REPO, ".env.local"));
}

loadEnvLocal();

const {
  SYSTEM_MESSAGE,
  SYSTEM_MESSAGE_VARIANTS,
  buildCheckPrompt,
  GROQ_SETTINGS
} = await import("../src/config/prompts.js");
const { validateAndFixResponse } = await import("../src/lib/validators.js");
const { applyFeedbackPolicy } = await import("../src/lib/applyFeedbackPolicy.js");
const { countEffectiveWords, countSentences } = await import("../src/lib/wordCount.js");

const FIXTURES = [
  {
    id: "clean-short",
    text: "I like cats. They are kind.",
    topicText: null,
    note: "clean short; no PREP"
  },
  {
    id: "grammar-vocab-spell",
    text: "My sister like cats. I go to osaka with my freind. It is fan.",
    topicText: null,
    note: "grammar + spelling + vocab; no PREP"
  },
  {
    id: "server-owned-surface",
    text: "she likes dogs. i am happy",
    topicText: null,
    note: "sentence-start + i + missing end punct (server-owned)"
  },
  {
    id: "prep-on-topic",
    text:
      "I think school lunches are important. I like them because they are healthy and cheap. For example, we eat rice, fish, and vegetables every day. That is why school lunches help students.",
    topicText: "Do you think school lunches are important? Why?",
    note: "≥25 words, ≥3 sentences → PREP on"
  },
  {
    id: "prep-with-mistakes",
    text:
      "I think hobby is important for student. Because it make us happy and relax. For example, I play soccer every sunday with my freind. So hobby is good for everyone.",
    topicText: "What is your hobby? Why do you like it?",
    note: "PREP + mixed mistakes"
  }
];

const apiKey = process.env.GROQ_API_KEY_11;
if (!apiKey) {
  console.error("Missing GROQ_API_KEY_11 (.env.local or env).");
  process.exit(1);
}

// PASS_REASONING_EFFORT=0 omits the field (Groq defaults to medium) for true baseline.
const passReasoningEffort = process.env.PASS_REASONING_EFFORT !== "0";
const reasoningEffort = passReasoningEffort
  ? process.env.REASONING_EFFORT || GROQ_SETTINGS.reasoning_effort || "low"
  : null;
const temperature =
  process.env.TEMPERATURE != null
    ? Number(process.env.TEMPERATURE)
    : GROQ_SETTINGS.temperature;
const passSeed = process.env.PASS_SEED !== "0";
const seed = passSeed
  ? process.env.SEED != null
    ? Number(process.env.SEED)
    : GROQ_SETTINGS.seed
  : null;
const variantName = process.env.SYSTEM_VARIANT || "en_rules_no_punct";
const systemMessage =
  SYSTEM_MESSAGE_VARIANTS[variantName] || SYSTEM_MESSAGE;
if (!SYSTEM_MESSAGE_VARIANTS[variantName] && process.env.SYSTEM_VARIANT) {
  console.error(
    `Unknown SYSTEM_VARIANT=${process.env.SYSTEM_VARIANT}. Use: ${Object.keys(SYSTEM_MESSAGE_VARIANTS).join(", ")}`
  );
  process.exit(1);
}
const label = process.env.LABEL || "run";
const outDir = resolve(ROOT, "artifacts");
mkdirSync(outDir, { recursive: true });

function shouldIncludePrep(text, topicText) {
  if (!topicText) return false;
  return countEffectiveWords(text) >= 25 && countSentences(text) >= 3;
}

function extractReasoningTokens(usage, choice) {
  const details =
    usage?.completion_tokens_details ||
    usage?.output_tokens_details ||
    null;
  if (details?.reasoning_tokens != null) return details.reasoning_tokens;
  // Fallback: estimate from reasoning string length (~4 chars/token) if present
  const reasoning = choice?.message?.reasoning;
  if (typeof reasoning === "string" && reasoning.length > 0) {
    return Math.round(reasoning.length / 4);
  }
  return null;
}

async function callGroq(prompt, { useJsonResponseFormat = true } = {}) {
  const requestBody = {
    model: GROQ_SETTINGS.model,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ],
    temperature,
    max_tokens: GROQ_SETTINGS.max_tokens
  };
  if (reasoningEffort) {
    requestBody.reasoning_effort = reasoningEffort;
  }
  if (seed != null && !Number.isNaN(seed)) {
    requestBody.seed = seed;
  }
  if (useJsonResponseFormat) {
    requestBody.response_format = GROQ_SETTINGS.response_format;
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function parseContent(content) {
  let text = typeof content === "string" ? content : "";
  text = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("JSON parse failed");
  }
}

function summarizeMistakes(mistakes) {
  return (mistakes || []).map((m) => ({
    type: m.type || null,
    code: m.code || null,
    original: m.original || "",
    corrected: m.corrected || "",
    explanation: m.explanation || ""
  }));
}

async function runFixture(fixture) {
  const includePrep = shouldIncludePrep(fixture.text, fixture.topicText);
  const prompt = buildCheckPrompt(fixture.text, fixture.topicText, {
    includePrepFeedback: includePrep
  });

  let { ok, status, body } = await callGroq(prompt, { useJsonResponseFormat: true });
  if (!ok) {
    const msg = body?.error?.message || "";
    if (/failed\s*_?generation/i.test(msg) || /Failed to generate JSON/i.test(msg)) {
      ({ ok, status, body } = await callGroq(prompt, { useJsonResponseFormat: false }));
    }
  }
  if (!ok) {
    return {
      id: fixture.id,
      error: body?.error?.message || `HTTP ${status}`,
      prepIncluded: includePrep
    };
  }

  const choice = body.choices?.[0];
  const usage = body.usage || {};
  const reasoningTokens = extractReasoningTokens(usage, choice);
  const completionTokens = usage.completion_tokens ?? null;
  const promptTokens = usage.prompt_tokens ?? null;
  // Visible completion ≈ total completion minus reasoning when available
  const visibleCompletion =
    reasoningTokens != null && completionTokens != null
      ? Math.max(0, completionTokens - reasoningTokens)
      : null;

  let raw;
  try {
    raw = parseContent(choice?.message?.content || "");
  } catch (e) {
    return {
      id: fixture.id,
      error: e.message,
      prepIncluded: includePrep,
      usage: { promptTokens, completionTokens, reasoningTokens, visibleCompletion }
    };
  }

  const validated = validateAndFixResponse(raw, { expectTopicFeedback: includePrep });
  const finalFeedback = applyFeedbackPolicy(fixture.text, {
    ...validated,
    mode: "practice",
    status: "ok",
    topicText: fixture.topicText || null
  });

  const modelMistakes = summarizeMistakes(raw.mistakes);
  const uiMistakes = summarizeMistakes(finalFeedback.mistakes);
  const modelOnlyDropped = modelMistakes.filter((m) =>
    uiMistakes.every(
      (u) => !(u.original === m.original && u.corrected === m.corrected && u.type === m.type)
    )
  );
  const serverAdded = uiMistakes.filter((u) => u.code && u.code !== "spelling");

  return {
    id: fixture.id,
    note: fixture.note,
    prepIncluded: includePrep,
    finish_reason: choice?.finish_reason ?? null,
    usage: {
      promptTokens,
      completionTokens,
      reasoningTokens,
      visibleCompletion,
      totalTokens: usage.total_tokens ?? null,
      reasoningChars:
        typeof choice?.message?.reasoning === "string"
          ? choice.message.reasoning.length
          : null
    },
    model: {
      mistakes: modelMistakes,
      topicFeedback: raw.topicFeedback ?? null
    },
    ui: {
      mistakes: uiMistakes,
      topicFeedback: finalFeedback.topicFeedback ?? null,
      overallScore: finalFeedback.overallScore ?? null
    },
    matchNotes: {
      modelMistakesDroppedByPolicy: modelOnlyDropped,
      serverOwnedAdded: serverAdded,
      spellingExplanationsRewritten: uiMistakes.filter(
        (m) => m.type === "spelling" && m.explanation.includes("つづりが間違っている")
      ).length
    }
  };
}

const results = [];
for (const fixture of FIXTURES) {
  process.stderr.write(`Running ${fixture.id}...\n`);
  const row = await runFixture(fixture);
  results.push(row);
  // gentle pacing for rate limits
  await new Promise((r) => setTimeout(r, 1200));
}

const totals = results.reduce(
  (acc, r) => {
    if (!r.usage) return acc;
    acc.prompt += r.usage.promptTokens || 0;
    acc.completion += r.usage.completionTokens || 0;
    acc.reasoning += r.usage.reasoningTokens || 0;
    acc.visible += r.usage.visibleCompletion || 0;
    acc.n += 1;
    return acc;
  },
  { prompt: 0, completion: 0, reasoning: 0, visible: 0, n: 0 }
);

const summary = {
  label,
  measuredAt: new Date().toISOString(),
  model: GROQ_SETTINGS.model,
  systemVariant: variantName,
  reasoning_effort: reasoningEffort,
  temperature,
  seed,
  max_tokens: GROQ_SETTINGS.max_tokens,
  fixtureCount: FIXTURES.length,
  totals,
  averages: {
    prompt: totals.n ? +(totals.prompt / totals.n).toFixed(1) : null,
    completion: totals.n ? +(totals.completion / totals.n).toFixed(1) : null,
    reasoning: totals.n ? +(totals.reasoning / totals.n).toFixed(1) : null,
    visible: totals.n ? +(totals.visible / totals.n).toFixed(1) : null
  },
  results
};

const outPath = resolve(outDir, `prompt-measure-${label}.json`);
writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ outPath, averages: summary.averages, totals: summary.totals }, null, 2));

if (process.env.COMPARE_TO) {
  const prev = JSON.parse(readFileSync(resolve(process.env.COMPARE_TO), "utf8"));
  const delta = {
    reasoning: summary.averages.reasoning - (prev.averages?.reasoning ?? 0),
    completion: summary.averages.completion - (prev.averages?.completion ?? 0),
    visible: summary.averages.visible - (prev.averages?.visible ?? 0)
  };
  console.log("delta vs compare:", delta);
}
