import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// The "latest" flash alias goes through spells of 503 "high demand" that can
// last for hours. When that happens we drop to the lite alias, then to a pinned
// current model, so the feature degrades instead of failing outright. Whatever
// model the caller asked for is tried first.
const MODEL_FALLBACKS = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.6-flash"];

// 400/401/403 mean the key or request is wrong — no other model will fix that.
function isFatal(error: unknown): boolean {
  const status = statusOf(error);
  return status === 400 || status === 401 || status === 403;
}

function statusOf(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const s = (error as { status: unknown }).status;
    if (typeof s === "number") return s;
  }
  const match = String((error as Error)?.message ?? "").match(/\b([45]\d\d)\b/);
  return match ? Number(match[1]) : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const { model, history, message } = req.body ?? {};

  if (typeof model !== "string" || typeof message !== "string") {
    res.status(400).json({ error: "model and message are required" });
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const chatHistory = Array.isArray(history) ? history : [];
  const models = [...new Set([model, ...MODEL_FALLBACKS])];
  let lastError: unknown;

  for (const candidate of models) {
    // One retry per model: covers a transient blip without hammering a model
    // that is genuinely down.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const generativeModel = genAI.getGenerativeModel({ model: candidate });
        const chat = generativeModel.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        const text = result.response.text();
        res.status(200).json({ text });
        return;
      } catch (error) {
        lastError = error;
        if (isFatal(error)) {
          console.error("Gemini proxy fatal error:", statusOf(error), (error as Error).message);
          res.status(502).json({ error: "Upstream AI request failed" });
          return;
        }
        // otherwise: retry once, then fall through to the next model
      }
    }
  }

  console.error(
    "Gemini proxy error, all models exhausted:",
    statusOf(lastError),
    (lastError as Error)?.message
  );
  res.status(502).json({ error: "Upstream AI request failed" });
}
