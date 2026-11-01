import OpenAI from "openai";
import { ZodSchema } from "zod";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const openaiApiKey = process.env.OPENAI_API_KEY || "";

export const isGeminiConfigured = Boolean(
  geminiApiKey && !geminiApiKey.includes("your-gemini-api-key")
);

export const isOpenAIConfigured = Boolean(
  openaiApiKey && !openaiApiKey.includes("your-openai-api-key") && openaiApiKey.startsWith("sk-")
);

export const configuredGeminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
export const configuredOpenAIModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured) return null;
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 25000,
      maxRetries: 1,
    });
  }
  return openaiInstance;
}

/**
 * Sanitizes untrusted user text to mitigate prompt injection, jailbreaks,
 * cross-site scripting (XSS), and script execution before embedding in GenAI prompts.
 */
export function sanitizeUserPromptInput(input: string, maxLength = 800): string {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/```/g, "'''")
    .replace(/<\/?(script|system|instruction|override|assistant|user|iframe|object|embed)[^>]*>/gi, "")
    .replace(/javascript:[^"'\s]*/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts|directives)/gi, "[redacted-directive]")
    .replace(/(?:bypass|disable)\s+(?:all\s+)?(?:safety|content)\s+filters?/gi, "[redacted-directive]")
    .trim();
}

/**
 * Calls Google Gemini REST API with structured JSON output mode.
 */
async function callGeminiStructured<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodSchema<T>;
  temperature?: number;
}): Promise<T | null> {
  if (!isGeminiConfigured) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${configuredGeminiModel}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${params.systemPrompt}\n\nStrict Output Instruction: You must output ONLY valid JSON matching the schema.\n\nInput Data:\n${params.userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: params.temperature ?? 0.4,
        },
      }),
    });

    if (!response.ok) {
      console.warn("[VervePlan Gemini API Warning]:", response.status, await response.text());
      return null;
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsedJson = JSON.parse(rawText);
    const validated = params.schema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn("[VervePlan Gemini Validation Warning]:", validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (err) {
    console.warn("[VervePlan Gemini Fallback Triggered]:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Calls OpenAI with JSON mode and validates the response against a Zod schema.
 */
async function callOpenAIStructured<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodSchema<T>;
  temperature?: number;
}): Promise<T | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: configuredOpenAIModel,
      temperature: params.temperature ?? 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsedJson = JSON.parse(raw);
    const validated = params.schema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn("[VervePlan OpenAI Validation Warning]:", validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (err) {
    console.warn("[VervePlan OpenAI Fallback Triggered]:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Universal GenAI invoker:
 * 1. Tries Google Gemini API (default for Google Prompt Wars)
 * 2. Falls back to OpenAI API if configured
 * 3. Falls back to the deterministic template engine if offline/unconfigured
 */
export async function generateStructuredAI<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodSchema<T>;
  temperature?: number;
}): Promise<{ data: T; isFallback: false } | null> {
  // 1. Prioritize Google Gemini API
  if (isGeminiConfigured) {
    const geminiData = await callGeminiStructured(params);
    if (geminiData) {
      return { data: geminiData, isFallback: false };
    }
  }

  // 2. Fall back to OpenAI API
  if (isOpenAIConfigured) {
    const openAiData = await callOpenAIStructured(params);
    if (openAiData) {
      return { data: openAiData, isFallback: false };
    }
  }

  // 3. Trigger deterministic engine
  return null;
}
