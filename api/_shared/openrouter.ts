// Shared OpenRouter caller. Files under api/_shared are helper modules, not
// routes — the leading underscore keeps Vercel from turning this into its own
// Serverless Function.
//
// OpenRouter retires ":free" model slugs without notice (the old
// meta-llama/llama-3.1-8b-instruct:free started 404ing once its free tier was
// dropped). Rather than pin one slug, we keep a short list of currently-working
// free models and fall through to the next whenever one is unavailable.
//
// Order = observed quality/reliability for our short-answer prompts: ling
// returns clean prose, the other two are "thinking" models that sometimes leak
// their reasoning and get rate-limited on the shared free pool, so they sit
// behind it as last-resort fallbacks.
export const FREE_MODELS = [
  "inclusionai/ling-3.0-flash-fin:free",
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-31b-it:free",
] as const;

export type ChatMessage = { role: string; content: string };

// Flat shape (not a discriminated union) so callers can read any field without
// narrowing — keeps the type-check happy across the different tsc configs this
// runs under (local tsc, Vitest/esbuild, and Vercel's @vercel/node builder).
export type OpenRouterResult = {
  ok: boolean;
  content: string; // reply text on success, "" otherwise
  model: string; // which model answered, "" otherwise
  status: number; // 200 on success, else the last upstream status (or 502)
  detail: string; // "" on success, else a short diagnostic
};

// Statuses where a different model might succeed: model gone (404), needs
// credits (402), rate limited (429), or an upstream hiccup (5xx).
function shouldTryNextModel(status: number | undefined, hadErrorBody: boolean): boolean {
  if (status === undefined) return true;
  if (status === 402 || status === 404 || status === 429) return true;
  if (status >= 500) return true;
  return hadErrorBody;
}

export async function callOpenRouter(
  apiKey: string,
  messages: ChatMessage[],
  extraBody: Record<string, unknown> = {}
): Promise<OpenRouterResult> {
  let lastStatus = 502;
  let lastDetail = "no models attempted";

  for (const model of FREE_MODELS) {
    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Athar Project",
        },
        body: JSON.stringify({ model, ...extraBody, messages }),
      });
    } catch (error) {
      lastStatus = 502;
      lastDetail = `fetch failed for ${model}: ${(error as Error).message}`;
      continue;
    }

    const data = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;

    if (!data?.error && typeof content === "string" && content.length > 0) {
      return { ok: true, content, model, status: 200, detail: "" };
    }

    const status = typeof response.status === "number" ? response.status : undefined;
    lastStatus = status ?? 502;
    lastDetail = data?.error?.message ?? `no usable choices from ${model} (HTTP ${lastStatus})`;

    if (shouldTryNextModel(status, Boolean(data?.error))) continue;
    break; // e.g. 401/403 — auth problem, another model won't help
  }

  return { ok: false, content: "", model: "", status: lastStatus, detail: lastDetail };
}
