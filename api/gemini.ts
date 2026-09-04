import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cap the function's wall-clock. Without this a slow or throttled upstream
// leaves the browser request hanging until the platform kills it (a silent
// 504 that shows in the UI as a spinner that never stops). We would rather
// fail fast with a 502 the frontend can surface.
export const config = { maxDuration: 30 };

// Abort any single upstream call that runs longer than this, and stop starting
// new ones once the whole handler has been running this long. Two models get a
// real attempt before we give up; a third would push past a safe budget.
const PER_CALL_TIMEOUT_MS = 9000;
const OVERALL_BUDGET_MS = 22000;

// The "latest" flash alias goes through spells of 503 "high demand" that can
// last for hours. When that happens we drop to the lite alias, then to a pinned
// current model, so the feature degrades instead of failing outright. Whatever
// model the caller asked for is tried first.
const MODEL_FALLBACKS = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.6-flash"];

// Statuses where trying again — same model or the next one — cannot help:
// the key or request is wrong (400/401/403), or the quota is spent (429, which
// on the free tier is shared across models, so falling through just burns the
// time budget before returning the same failure).
function isFatal(status: number | undefined): boolean {
  return status === 400 || status === 401 || status === 403 || status === 429;
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
  const startedAt = Date.now();
  let lastError: unknown;
  let lastStatus: number | undefined;

  for (const candidate of models) {
    // Don't start a call that can't finish inside the remaining budget.
    if (Date.now() - startedAt > OVERALL_BUDGET_MS - PER_CALL_TIMEOUT_MS) break;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_CALL_TIMEOUT_MS);
    try {
      const generativeModel = genAI.getGenerativeModel({ model: candidate });
      const chat = generativeModel.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message, {
        signal: controller.signal,
        timeout: PER_CALL_TIMEOUT_MS,
      });
      const text = result.response.text();
      res.status(200).json({ text });
      return;
    } catch (error) {
      lastError = error;
      lastStatus = statusOf(error);
      if (isFatal(lastStatus)) {
        console.error("Gemini proxy fatal error:", lastStatus, (error as Error).message);
        res.status(502).json({ error: "Upstream AI request failed" });
        return;
      }
      // 404 (model gone), 503 (overloaded), or an aborted slow call — fall
      // through and try the next model.
    } finally {
      clearTimeout(timer);
    }
  }

  console.error(
    "Gemini proxy error, all models exhausted:",
    lastStatus,
    (lastError as Error)?.message
  );
  res.status(502).json({ error: "Upstream AI request failed" });
}
