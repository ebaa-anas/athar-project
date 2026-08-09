# AI Key Vercel Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop shipping the Gemini and OpenRouter API keys to the browser. Move both providers behind Vercel serverless functions that hold the real keys server-side, and update all five frontend call sites to use them instead of calling the providers directly. (Originally scoped to three call sites — Tasks 6 and 7 were added mid-plan after a repo-wide grep during Task 2 surfaced two more: `CrisisManagement.tsx` and `AdminOverview.tsx`.)

**Architecture:** Two new serverless functions, `api/gemini.ts` and `api/openrouter.ts`, deployed alongside the existing Vite frontend as one Vercel project. Each function receives the same shape of request the frontend used to send straight to the provider, attaches the real (server-only, non-`VITE_`-prefixed) API key, calls the provider, and returns a small JSON response. Both functions are unit-tested directly (mocking the provider SDK/`fetch`) so they don't require a live Vercel deployment or real API keys to verify.

**Tech Stack:** `@vercel/node` (types), `@google/generative-ai` (already a dependency, now used server-side instead of client-side), `vitest`.

## Global Constraints

- No `VITE_`-prefixed env var may hold `GEMINI_API_KEY` or `OPENROUTER_API_KEY` after this plan — those names are reserved for the new server-only vars.
- Preserve each call site's existing behavior exactly (same Gemini model per call site, same OpenRouter prompt/personality logic, same fallback error strings) — this plan relocates where the API call happens, it does not change what it does.
- `getAtharResponse(messagesHistory, userType)` in `src/gemini.js` keeps its exact exported signature, so `src/chatbot/ChatbotWidget.tsx` requires no changes.
- Spec: `docs/superpowers/specs/2026-08-09-secure-ai-keys-and-firestore-rules-design.md` (Architecture and Error Handling sections).

---

### Task 1: `api/gemini.ts` proxy function

**Files:**
- Create: `api/gemini.ts`
- Create: `api/gemini.test.ts`
- Modify: `package.json` (add `@vercel/node`, `vitest` devDependencies and a `test:api` script)

**Interfaces:**
- Produces: `POST /api/gemini` accepting `{ model: string, history?: Array<{ role: "user" | "model", parts: Array<{ text: string }> }>, message: string }`, returning `{ text: string }` on success or `{ error: string }` with a non-200 status on failure. Consumed by Tasks 3 and 4.

- [ ] **Step 1: Install dependencies**

```bash
npm install --save-dev @vercel/node vitest
```

- [ ] **Step 2: Add the `test:api` script**

Edit `package.json`, in `"scripts"`:

```json
    "test:api": "vitest run api"
```

Pointing `vitest run` directly at the `api` folder (rather than a shared `vitest.config.ts`) keeps this plan's test setup independent of the Firestore rules plan's `firestore-tests/*.test.ts` files.

- [ ] **Step 3: Write the failing tests**

Create `api/gemini.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMessageMock = vi.fn();
const startChatMock = vi.fn(() => ({ sendMessage: sendMessageMock }));
const getGenerativeModelMock = vi.fn(() => ({ startChat: startChatMock }));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: getGenerativeModelMock,
  })),
}));

import handler from "./gemini";

function mockRes() {
  const res: any = {};
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  return res;
}

describe("POST /api/gemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("rejects non-POST methods", async () => {
    const res = mockRes();
    await handler({ method: "GET" } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 500 when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = mockRes();
    await handler(
      { method: "POST", body: { model: "gemini-2.5-flash", message: "hi" } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("returns 400 when model or message is missing", async () => {
    const res = mockRes();
    await handler({ method: "POST", body: { message: "hi" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("calls the model with the given history and message, returning its text", async () => {
    sendMessageMock.mockResolvedValue({ response: { text: () => "mocked reply" } });
    const res = mockRes();

    await handler(
      {
        method: "POST",
        body: {
          model: "gemini-2.5-flash",
          history: [{ role: "user", parts: [{ text: "seed" }] }],
          message: "hello",
        },
      } as any,
      res
    );

    expect(getGenerativeModelMock).toHaveBeenCalledWith({ model: "gemini-2.5-flash" });
    expect(startChatMock).toHaveBeenCalledWith({
      history: [{ role: "user", parts: [{ text: "seed" }] }],
    });
    expect(sendMessageMock).toHaveBeenCalledWith("hello");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ text: "mocked reply" });
  });

  it("defaults history to an empty array when omitted", async () => {
    sendMessageMock.mockResolvedValue({ response: { text: () => "mocked reply" } });
    const res = mockRes();

    await handler(
      { method: "POST", body: { model: "gemini-2.5-flash", message: "hello" } } as any,
      res
    );

    expect(startChatMock).toHaveBeenCalledWith({ history: [] });
  });

  it("returns 502 without leaking the error when the SDK throws", async () => {
    sendMessageMock.mockRejectedValue(new Error("upstream exploded with secret detail"));
    const res = mockRes();

    await handler(
      { method: "POST", body: { model: "gemini-2.5-flash", message: "hello" } } as any,
      res
    );

    expect(res.status).toHaveBeenCalledWith(502);
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain("secret detail");
  });
});
```

- [ ] **Step 4: Run the tests to confirm they fail**

Run: `npm run test:api`
Expected: FAIL with an error resolving `./gemini` (the module doesn't exist yet).

- [ ] **Step 5: Implement `api/gemini.ts`**

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({ model });
    const chat = generativeModel.startChat({
      history: Array.isArray(history) ? history : [],
    });
    const result = await chat.sendMessage(message);
    const text = result.response.text();
    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini proxy error:", error);
    res.status(502).json({ error: "Upstream AI request failed" });
  }
}
```

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `npm run test:api`
Expected: PASS (all cases in `POST /api/gemini`).

- [ ] **Step 7: Commit**

```bash
git add api/gemini.ts api/gemini.test.ts package.json package-lock.json
git commit -m "Add Vercel proxy function for Gemini"
```

---

### Task 2: `api/openrouter.ts` proxy function + slim `src/gemini.js`

**Files:**
- Create: `api/openrouter.ts`
- Create: `api/openrouter.test.ts`
- Modify: `src/gemini.js`
- Create: `src/gemini.test.js`

**Interfaces:**
- Produces: `POST /api/openrouter` accepting `{ messagesHistory: Array<{role: string, content: string}>, userType: "volunteer" | "organization" | null }`, returning `{ reply: string }` on success or `{ error: string }` on failure.
- Modifies: `getAtharResponse(messagesHistory, userType)` (unchanged signature/return type — still resolves to a reply string) to call the new endpoint instead of OpenRouter directly. `src/chatbot/ChatbotWidget.tsx` is not touched.

- [ ] **Step 1: Write the failing tests for the proxy function**

Create `api/openrouter.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./openrouter";

function mockRes() {
  const res: any = {};
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  return res;
}

describe("POST /api/openrouter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("rejects non-POST methods", async () => {
    const res = mockRes();
    await handler({ method: "GET" } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 500 when OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const res = mockRes();
    await handler(
      { method: "POST", body: { messagesHistory: [], userType: "volunteer" } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("returns 400 when messagesHistory is missing", async () => {
    const res = mockRes();
    await handler({ method: "POST", body: { userType: "volunteer" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("calls OpenRouter and strips a leading greeting from the reply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          choices: [{ message: { content: "Hello! Athar connects volunteers with orgs." } }],
        }),
      })
    );

    const res = mockRes();
    await handler(
      {
        method: "POST",
        body: { messagesHistory: [{ role: "user", content: "what is athar" }], userType: "volunteer" },
      } as any,
      res
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: "Athar connects volunteers with orgs." });
  });

  it("returns 502 when the upstream response has no choices", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ error: "boom" }) }));
    const res = mockRes();
    await handler(
      { method: "POST", body: { messagesHistory: [], userType: null } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("returns 502 when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const res = mockRes();
    await handler(
      { method: "POST", body: { messagesHistory: [], userType: null } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(502);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm run test:api`
Expected: FAIL with an error resolving `./openrouter`.

- [ ] **Step 3: Implement `api/openrouter.ts`**

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ATHAR_CONTEXT = `
Athar is a web-based platform that connects verified volunteers with organizations.

Volunteers can:
- Register on the website
- Complete their profile (skills and interests)
- Browse opportunities
- Apply to organizations

Organizations can:
- Register their organization
- Post volunteer opportunities
- Manage applicants

Athar focuses on:
Education, Health, Crisis Relief, Environment, Animal Welfare, Community.

Important:
- Athar is NOT a mobile app
- It is a WEBSITE only
`;

function userContextFor(userType: unknown) {
  if (userType === "volunteer") {
    return `
The user is a VOLUNTEER.
Guide them to explore opportunities, improve their profile, and apply to organizations.
`;
  }
  if (userType === "organization") {
    return `
The user is an ORGANIZATION.
Help them post opportunities, manage volunteers, and use the platform effectively.
`;
  }
  return `
The user is a GUEST.
Explain what Athar is and how to join simply.
`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const { messagesHistory, userType } = req.body ?? {};
  if (!Array.isArray(messagesHistory)) {
    res.status(400).json({ error: "messagesHistory is required" });
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Athar Project",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        temperature: 0.3,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: `
You are Athar Assistant.

${userContextFor(userType)}

Context:
${ATHAR_CONTEXT}

RULES:
- Adapt your answer based on user type
- Respond to greetings naturally
- Do NOT start every response with "Hello"
- Use Athar context when relevant
- Do NOT invent features (like mobile app)
- Keep answers SHORT (2-4 lines max)
- Be professional and clear

If unrelated:
"I can help with Athar platform questions only."
`,
          },
          ...messagesHistory,
        ],
      }),
    });

    const data = await response.json();

    if (data.error || !data.choices || !data.choices.length) {
      res.status(502).json({ error: "Upstream AI request failed" });
      return;
    }

    let reply = data.choices[0].message.content.trim();
    reply = reply.replace(/^(hello|hi|hey)[!,. ]*/i, "");
    reply = reply.replace(/\n{3,}/g, "\n\n");

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenRouter proxy error:", error);
    res.status(502).json({ error: "Upstream AI request failed" });
  }
}
```

- [ ] **Step 4: Run the proxy tests to confirm they pass**

Run: `npm run test:api`
Expected: PASS (all cases in `POST /api/openrouter`, and `POST /api/gemini` from Task 1 still passing).

- [ ] **Step 5: Write the failing test for the slimmed `src/gemini.js`**

Create `src/gemini.test.js`:

```javascript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAtharResponse } from "./gemini";

describe("getAtharResponse", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to /api/openrouter and returns the reply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reply: "Athar connects volunteers with organizations." }),
      })
    );

    const reply = await getAtharResponse([{ role: "user", content: "what is athar" }], "volunteer");

    expect(fetch).toHaveBeenCalledWith(
      "/api/openrouter",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          messagesHistory: [{ role: "user", content: "what is athar" }],
          userType: "volunteer",
        }),
      })
    );
    expect(reply).toBe("Athar connects volunteers with organizations.");
  });

  it("falls back to a friendly message when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const reply = await getAtharResponse([], null);
    expect(reply).toBe("Sorry, I'm having trouble connecting.");
  });

  it("falls back to a friendly message when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const reply = await getAtharResponse([], null);
    expect(reply).toBe("Connection failed.");
  });
});
```

- [ ] **Step 6: Run the test to confirm it fails**

`test:api` only points at the `api` folder, so run vitest directly against this file:

Run: `npx vitest run src/gemini.test.js`
Expected: FAIL (`src/gemini.js` still calls OpenRouter directly, not `/api/openrouter`, so the mocked `fetch` assertion doesn't match).

- [ ] **Step 7: Replace `src/gemini.js` with the thin proxy wrapper**

```javascript
export const getAtharResponse = async (messagesHistory, userType) => {
  try {
    const response = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messagesHistory, userType }),
    });

    if (!response.ok) {
      return "Sorry, I'm having trouble connecting.";
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error(error);
    return "Connection failed.";
  }
};
```

- [ ] **Step 8: Run the test to confirm it passes**

Run: `npx vitest run src/gemini.test.js`
Expected: PASS (all three cases).

- [ ] **Step 9: Commit**

```bash
git add api/openrouter.ts api/openrouter.test.ts src/gemini.js src/gemini.test.js package.json
git commit -m "Add Vercel proxy function for OpenRouter; slim gemini.js to a thin client"
```

---

### Task 3: Point `TrainingSimulator.tsx` at `/api/gemini`

**Files:**
- Modify: `src/components/TrainingSimulator.tsx:1-5` (imports), `:33-34` (genAI init), `:112` (chatSession state), `:167-218` (`generateNewScenario`), `:220-243` (`startSimulation`), `:245-293` (`sendMessage`), `:295-344` (`concludeSimulation`)

**Interfaces:**
- Consumes: `POST /api/gemini` from Task 1.
- Changes the internal `chatSession` state (previously an SDK `ChatSession` object, typed `any`) to a plain `chatHistory: Array<{ role: "user" | "model", parts: Array<{ text: string }> }>` array — this is a local implementation detail of this component, not consumed elsewhere.

The Gemini SDK's `model.startChat().sendMessage()` pattern keeps conversation history inside the SDK object, which lived in the browser. The proxy is stateless, so the frontend now owns the history array and sends the full context with each call — behaviorally identical, since that's what the SDK was doing over the wire anyway.

- [ ] **Step 1: Remove the client-side SDK import and key usage**

In `src/components/TrainingSimulator.tsx`, remove line 5 (`import { GoogleGenerativeAI } from "@google/generative-ai";`) and lines 33-34 (the `// --- INITIALIZE GEMINI AI ---` comment and `const genAI = ...` line).

- [ ] **Step 2: Replace the `chatSession` state with `chatHistory`**

Change line 112 from:

```typescript
  const [chatSession, setChatSession] = useState<any>(null);
```

to:

```typescript
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>
  >([]);
```

- [ ] **Step 3: Add a small helper for calling the proxy**

Add this near the top of the component file (after the `INITIAL_SCENARIOS` constant, before the component function):

```typescript
async function callGemini(
  model: string,
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  message: string
): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, history, message }),
  });

  if (!response.ok) {
    throw new Error("Gemini proxy request failed");
  }

  const data = await response.json();
  return data.text;
}
```

- [ ] **Step 4: Update `generateNewScenario` to call the proxy**

Replace:

```typescript
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const prompt = `
        You are an expert crisis management trainer for the official Athar Volunteer Reserve. Generate a completely new, unique, high-stakes roleplay scenario for a field volunteer or first responder. 
        
        CRITICAL RULE: The scenario MUST be a hands-on disaster response, humanitarian crisis, medical emergency, or psychological first aid situation. Do NOT generate corporate, PR, or business scenarios. The user is a field volunteer, not an executive.
        
        Return ONLY a valid JSON object matching this exact structure. Do NOT wrap it in markdown blockquotes or text.
        {
          "title": "A punchy title for the crisis scenario",
          "category": "Choose one: Crisis Management, Mental Health, Communication, Healthcare, or Leadership",
          "difficulty": "Choose one: Beginner, Intermediate, or Advanced",
          "estimatedTime": Random number between 10 and 25,
          "skillPath": "Name of a relevant field training module",
          "description": "A 2-sentence description of the disaster/crisis the volunteer will face on the ground.",
          "systemPrompt": "Detailed instructions for YOU, the AI, to act out this scenario. Define your persona (e.g., a trapped victim, a panicked civilian, an injured person), the immediate physical danger or emotional problem, and how you should react to the volunteer.",
          "initialMessage": "The very first panicked or urgent message you will say to start the simulation."
        }
      `;

      const result = await model.generateContent(prompt);
      let rawJson = result.response.text();
      rawJson = rawJson.replace(/```json/gi, '').replace(/```/gi, '').trim();
```

with:

```typescript
      const prompt = `
        You are an expert crisis management trainer for the official Athar Volunteer Reserve. Generate a completely new, unique, high-stakes roleplay scenario for a field volunteer or first responder. 
        
        CRITICAL RULE: The scenario MUST be a hands-on disaster response, humanitarian crisis, medical emergency, or psychological first aid situation. Do NOT generate corporate, PR, or business scenarios. The user is a field volunteer, not an executive.
        
        Return ONLY a valid JSON object matching this exact structure. Do NOT wrap it in markdown blockquotes or text.
        {
          "title": "A punchy title for the crisis scenario",
          "category": "Choose one: Crisis Management, Mental Health, Communication, Healthcare, or Leadership",
          "difficulty": "Choose one: Beginner, Intermediate, or Advanced",
          "estimatedTime": Random number between 10 and 25,
          "skillPath": "Name of a relevant field training module",
          "description": "A 2-sentence description of the disaster/crisis the volunteer will face on the ground.",
          "systemPrompt": "Detailed instructions for YOU, the AI, to act out this scenario. Define your persona (e.g., a trapped victim, a panicked civilian, an injured person), the immediate physical danger or emotional problem, and how you should react to the volunteer.",
          "initialMessage": "The very first panicked or urgent message you will say to start the simulation."
        }
      `;

      let rawJson = await callGemini("gemini-3.5-flash", [], prompt);
      rawJson = rawJson.replace(/```json/gi, '').replace(/```/gi, '').trim();
```

- [ ] **Step 5: Update `startSimulation` to seed `chatHistory` instead of an SDK session**

Replace:

```typescript
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const session = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: scenario.systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to begin the simulation in character." }],
        },
      ],
    });
    
    setChatSession(session);
```

with:

```typescript
    setChatHistory([
      {
        role: "user",
        parts: [{ text: scenario.systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to begin the simulation in character." }],
      },
    ]);
```

- [ ] **Step 6: Update `sendMessage` to call the proxy and grow `chatHistory`**

Replace the guard clause and the call:

```typescript
    if (!currentInput.trim() || !activeSimulation || !chatSession) return;
```

with:

```typescript
    if (!currentInput.trim() || !activeSimulation) return;
```

Replace:

```typescript
      const result = await chatSession.sendMessage(evaluationPrompt);
      const text = result.response.text();
```

with:

```typescript
      const text = await callGemini("gemini-3.5-flash", chatHistory, evaluationPrompt);
```

After the existing `setMessages(...)` and `setScore(...)` calls in the try block (right after `setScore(prev => Math.min(100, Math.max(0, prev + points)));`), append the new turn to history:

```typescript
      setChatHistory(prev => [
        ...prev,
        { role: "user", parts: [{ text: evaluationPrompt }] },
        { role: "model", parts: [{ text }] },
      ]);
```

- [ ] **Step 7: Update `concludeSimulation` to call the proxy**

Replace the guard clause:

```typescript
    if (!chatSession || !currentUser || !activeSimulation) return;
```

with:

```typescript
    if (!currentUser || !activeSimulation) return;
```

Replace:

```typescript
      const result = await chatSession.sendMessage(concludingPrompt);
      let rawText = result.response.text();
```

with:

```typescript
      let rawText = await callGemini("gemini-3.5-flash", chatHistory, concludingPrompt);
```

- [ ] **Step 8: Update `resetSimulation` to clear the new state**

Replace:

```typescript
    setChatSession(null);
```

with:

```typescript
    setChatHistory([]);
```

- [ ] **Step 9: Type-check and build**

Run: `npm run build 2>&1 | grep TrainingSimulator.tsx`

Note: `npm run build` itself already fails on this repo — there are ~82 pre-existing TypeScript errors unrelated to this plan, including 6 pre-existing unused-import errors already in this exact file before this task (`AvatarImage`, `AlertCircle`, `ShieldCheck`, `Target`, `Users`, `Icon` at lines 11/15/16/16/16/700) — those are not this task's responsibility and may still appear.

Expected: the grep output contains only those same 6 pre-existing unused-import lines (or fewer, if any of those imports happen to get removed incidentally) — zero lines mentioning `chatSession`, `genAI`, or `GoogleGenerativeAI`. Confirm the latter directly with `grep -n "chatSession\|genAI\|GoogleGenerativeAI" src/components/TrainingSimulator.tsx`, expect no output.

- [ ] **Step 10: Manually verify in the browser**

This component has no existing test harness and building one is out of scope for this plan. Run `npm run dev`, open the Training Simulator as a volunteer, and confirm:
1. "Generate new scenario" produces a scenario (exercises `generateNewScenario` → `/api/gemini`).
2. Starting a simulation and sending a message gets an in-character reply and feedback/points (exercises `startSimulation` + `sendMessage`).
3. Concluding a simulation produces a debrief paragraph (exercises `concludeSimulation`).

Note: this requires `/api/gemini` to actually be running (via `vercel dev`, once a Vercel project is linked — see "After this plan" at the end of this document) and a real `GEMINI_API_KEY` set in the environment. Until that's set up, this step will fail with a network/connection error, not a code error.

- [ ] **Step 11: Commit**

```bash
git add src/components/TrainingSimulator.tsx
git commit -m "Point TrainingSimulator at the Gemini Vercel proxy"
```

---

### Task 4: Point `OrganizationMessages.tsx` at `/api/gemini`

**Files:**
- Modify: `src/components/organization/OrganizationMessages.tsx:5` (import), `:20-28` (comment + genAI init), `:268-269` (`runAITriage`)

**Interfaces:**
- Consumes: `POST /api/gemini` from Task 1, via the same `callGemini` helper pattern as Task 3 (defined locally in this file since it's a separate component — no shared module needed for a two-call-site helper).

- [ ] **Step 1: Remove the client-side SDK import and key usage**

In `src/components/organization/OrganizationMessages.tsx`, remove line 5 (`import { GoogleGenerativeAI } from "@google/generative-ai";`) and lines 20-28 (the comment block about the leaked key plus the `const genAI = ...` line).

- [ ] **Step 2: Add the proxy helper**

Add near the top of the file, after the existing imports:

```typescript
async function callGemini(model: string, message: string): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, history: [], message }),
  });

  if (!response.ok) {
    throw new Error("Gemini proxy request failed");
  }

  const data = await response.json();
  return data.text;
}
```

- [ ] **Step 3: Update `runAITriage` to call the proxy**

Replace:

```typescript
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
```

with:

```typescript
      const responseText = await callGemini("gemini-2.5-flash", prompt);
```

- [ ] **Step 4: Type-check and build**

Run: `npm run build 2>&1 | grep OrganizationMessages.tsx`

Note: `npm run build` itself already fails on this repo — there are ~82 pre-existing TypeScript errors unrelated to this plan, in other files. This file has zero pre-existing errors, so unlike `TrainingSimulator.tsx` in Task 3, the bar here is a clean file.

Expected: no output. Confirm with `grep -n "genAI\|GoogleGenerativeAI" src/components/organization/OrganizationMessages.tsx` — expect no output.

- [ ] **Step 5: Manually verify in the browser**

No existing test harness for this component either. Run `npm run dev`, open Organization Messages as an organization with some message history, and click the AI triage action — confirm it still produces a SitRep report (exercises `runAITriage` → `/api/gemini`). Same caveat as Task 3 Step 10: requires `/api/gemini` actually running with a real key.

- [ ] **Step 6: Commit**

```bash
git add src/components/organization/OrganizationMessages.tsx
git commit -m "Point OrganizationMessages triage at the Gemini Vercel proxy"
```

---

### Task 5: Environment variable cleanup

**Files:**
- Create: `.env.example`
- Modify: `.env` (local only, not committed — instructions, not a diff)

**Interfaces:**
- Consumes: nothing from earlier tasks besides their agreement on the var names `GEMINI_API_KEY` and `OPENROUTER_API_KEY` (no `VITE_` prefix).

- [ ] **Step 1: Create `.env.example`**

```
# Firebase (client SDK config — not secret, safe to be public; see
# https://firebase.google.com/docs/projects/api-keys)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AI provider keys — SERVER-SIDE ONLY. Do not prefix with VITE_, or Vite
# will inline them into the client bundle. These are read by the
# functions in api/, not by the frontend.
GEMINI_API_KEY=
OPENROUTER_API_KEY=
```

- [ ] **Step 2: Update the local `.env`**

This file is gitignored, so there's no diff to commit — do this manually:
1. Remove the `VITE_GEMINI_API_KEY` and `VITE_OPENROUTER_API_KEY` lines.
2. Add `GEMINI_API_KEY=` and `OPENROUTER_API_KEY=` with the same key values (unprefixed).
3. **Revoke and rotate the Gemini key that was hardcoded in `OrganizationMessages.tsx`** (`AIzaSyDiNP9rAwU2fyxz9E1VgkQGnnV_p8LMjgY`, per that file's now-removed comment) — that key was previously exposed in the browser bundle and shared in chat, so treat it as compromised regardless of this plan. Generate a new one in Google AI Studio and use that as `GEMINI_API_KEY`.

- [ ] **Step 3: Verify nothing references the old `VITE_` AI key vars**

Run: `grep -rn "VITE_GEMINI_API_KEY\|VITE_OPENROUTER_API_KEY" src api`
Expected: no output (Tasks 2-4 already removed every reference).

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "Add .env.example documenting server-only AI key vars"
```

---

---

### Task 6: `api/crisis-tasking.ts` proxy + point `CrisisManagement.tsx` at it

**Files:**
- Create: `api/crisis-tasking.ts`
- Create: `api/crisis-tasking.test.ts`
- Modify: `src/components/organization/CrisisManagement.tsx:291-339` (`handleGenerateAITasks`)

**Interfaces:**
- Produces: `POST /api/crisis-tasking` accepting `{ title: string, location: string, severity: string }`, returning `{ description: string, skillsNeeded: string }` on success or `{ error: string }` on failure.

Added mid-plan: a repo-wide grep during Task 2's implementation surfaced a second, previously-undiscovered OpenRouter call site outside this plan's original scope — `CrisisManagement.tsx`'s "AI Tasking Engine" (`handleGenerateAITasks`), which calls OpenRouter directly with `VITE_OPENROUTER_API_KEY`. Its prompt shape (a fixed crisis-tasking system prompt, single-shot, expects `{description, skillsNeeded}` JSON back) is different enough from the chatbot's `getAtharResponse` contract that it needs its own endpoint rather than overloading `api/openrouter.ts` (which is already implemented and reviewed — reusing it here would mean branching two unrelated prompt shapes through one function).

- [ ] **Step 1: Write the failing tests**

Create `api/crisis-tasking.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./crisis-tasking";

function mockRes() {
  const res: any = {};
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  return res;
}

describe("POST /api/crisis-tasking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("rejects non-POST methods", async () => {
    const res = mockRes();
    await handler({ method: "GET" } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 500 when OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const res = mockRes();
    await handler(
      { method: "POST", body: { title: "Flood", location: "Riverside", severity: "Critical" } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("returns 400 when title, location, or severity is missing", async () => {
    const res = mockRes();
    await handler({ method: "POST", body: { title: "Flood" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("calls OpenRouter and returns the parsed description/skillsNeeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  '```json\n{"description":"Flooding in Riverside","skillsNeeded":"Boating, First Aid, Logistics, Communications, Search and Rescue"}\n```',
              },
            },
          ],
        }),
      })
    );

    const res = mockRes();
    await handler(
      { method: "POST", body: { title: "Flood", location: "Riverside", severity: "Critical" } } as any,
      res
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      description: "Flooding in Riverside",
      skillsNeeded: "Boating, First Aid, Logistics, Communications, Search and Rescue",
    });
  });

  it("returns 502 when the upstream response has no content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ error: "boom" }) }));
    const res = mockRes();
    await handler(
      { method: "POST", body: { title: "Flood", location: "Riverside", severity: "Critical" } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("returns 502 when the upstream content isn't valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ choices: [{ message: { content: "not json" } }] }),
      })
    );
    const res = mockRes();
    await handler(
      { method: "POST", body: { title: "Flood", location: "Riverside", severity: "Critical" } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("returns 502 when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const res = mockRes();
    await handler(
      { method: "POST", body: { title: "Flood", location: "Riverside", severity: "Critical" } } as any,
      res
    );
    expect(res.status).toHaveBeenCalledWith(502);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm run test:api`
Expected: FAIL with an error resolving `./crisis-tasking` (the module doesn't exist yet); other already-passing tests (`api/gemini.test.ts`, `api/openrouter.test.ts`) continue to pass.

- [ ] **Step 3: Implement `api/crisis-tasking.ts`**

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const { title, location, severity } = req.body ?? {};
  if (typeof title !== "string" || typeof location !== "string" || typeof severity !== "string") {
    res.status(400).json({ error: "title, location, and severity are required" });
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are an expert crisis management AI for Project Athar. Based on the crisis title, location, and severity, quickly generate a professional situation report (description) and a comma-separated list of the 5 most critical skills needed (skillsNeeded). Return ONLY valid JSON with keys: 'description' and 'skillsNeeded'.",
          },
          {
            role: "user",
            content: `Title: ${title}, Location: ${location}, Severity: ${severity}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const aiContent = data?.choices?.[0]?.message?.content;

    if (!aiContent) {
      res.status(502).json({ error: "Upstream AI request failed" });
      return;
    }

    const cleanedJson = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    res.status(200).json({
      description: parsed.description ?? "",
      skillsNeeded: parsed.skillsNeeded ?? "",
    });
  } catch (error) {
    console.error("Crisis tasking proxy error:", error);
    res.status(502).json({ error: "Upstream AI request failed" });
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm run test:api`
Expected: PASS (all cases in `POST /api/crisis-tasking`, plus `api/gemini.test.ts` and `api/openrouter.test.ts` still passing).

- [ ] **Step 5: Point `CrisisManagement.tsx` at the new endpoint**

Replace the body of `handleGenerateAITasks` (currently the direct OpenRouter `fetch` with inline JSON parsing) with:

```typescript
  const handleGenerateAITasks = async () => {
    if (!newCrisis.title || !newCrisis.location) {
      alert("Please provide at least an Incident Title and Location for the AI to analyze.");
      return;
    }
    
    setIsGeneratingTasks(true);
    try {
      const response = await fetch("/api/crisis-tasking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCrisis.title,
          location: newCrisis.location,
          severity: newCrisis.severity,
        }),
      });

      if (!response.ok) {
        throw new Error("Crisis tasking proxy request failed");
      }

      const { description, skillsNeeded } = await response.json();

      setNewCrisis(prev => ({
        ...prev,
        description: description || prev.description,
        skillsNeeded: skillsNeeded || prev.skillsNeeded
      }));
      
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate AI tasks. Please check your API connection.");
    }
    setIsGeneratingTasks(false);
  };
```

This preserves the exact same fallback behavior (alert on failure) as the original — the JSON parsing/cleaning that used to happen client-side now happens server-side in `api/crisis-tasking.ts`, so a malformed AI response surfaces as a 502 (caught by `!response.ok`) instead of a client-side `JSON.parse` throw, landing in the same catch block either way.

- [ ] **Step 6: Type-check and verify**

Run: `npm run build 2>&1 | grep CrisisManagement.tsx`
Expected: no output (this file has no pre-existing errors, same as `OrganizationMessages.tsx` in Task 4).

Run: `grep -n "VITE_OPENROUTER_API_KEY" src/components/organization/CrisisManagement.tsx` — expect no output.

- [ ] **Step 7: Manually verify in the browser**

No existing test harness for this component. Run `npm run dev`, open Crisis Management as an organization, fill in an incident title/location, and click the AI tasking generator — confirm it still fills in a description and skills-needed list. Same caveat as other manual-verification steps: requires `/api/crisis-tasking` actually running (via `vercel dev` once linked) with a real `OPENROUTER_API_KEY`.

- [ ] **Step 8: Commit**

```bash
git add api/crisis-tasking.ts api/crisis-tasking.test.ts src/components/organization/CrisisManagement.tsx
git commit -m "Add Vercel proxy for crisis-tasking AI; point CrisisManagement at it"
```

---

### Task 7: Point `AdminOverview.tsx` at `/api/gemini`

**Files:**
- Modify: `src/components/admin/AdminOverview.tsx:4` (import), `:29` (genAI init), `:148-174` (`handleGenerateReport`)

**Interfaces:**
- Consumes: `POST /api/gemini` from Task 1, via a local `callGemini` helper (same pattern as Tasks 3 and 4).

Also added mid-plan, alongside Task 6: the same repo-wide grep found a fourth Gemini call site, `AdminOverview.tsx`'s `handleGenerateReport` ("AI Report Generator"), using `VITE_GEMINI_API_KEY` directly. Unlike `CrisisManagement.tsx`, this one is a simple single-shot `generateContent(prompt)` call — the same shape Task 4 already proxies — so it reuses the existing `/api/gemini` endpoint, no new backend function needed.

- [ ] **Step 1: Remove the client-side SDK import and key usage**

In `src/components/admin/AdminOverview.tsx`, remove line 4 (`import { GoogleGenerativeAI } from "@google/generative-ai";`) and line 29 (`const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);`).

- [ ] **Step 2: Add the proxy helper**

Add near the top of the file, after the existing imports:

```typescript
async function callGemini(model: string, message: string): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, history: [], message }),
  });

  if (!response.ok) {
    throw new Error("Gemini proxy request failed");
  }

  const data = await response.json();
  return data.text;
}
```

- [ ] **Step 3: Update `handleGenerateReport` to call the proxy**

Replace:

```typescript
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const dataSummary = `
```

with:

```typescript
      const dataSummary = `
```

(dropping the `model` variable declaration — it's no longer needed here) and replace:

```typescript
      const result = await model.generateContent(prompt);
      const reportHTML = result.response.text();
```

with:

```typescript
      const reportHTML = await callGemini("gemini-2.5-flash", prompt);
```

- [ ] **Step 4: Type-check and verify**

Run: `npm run build 2>&1 | grep AdminOverview.tsx`
Expected: no output.

Run: `grep -n "genAI\|GoogleGenerativeAI\|VITE_GEMINI_API_KEY" src/components/admin/AdminOverview.tsx` — expect no output.

- [ ] **Step 5: Manually verify in the browser**

Run `npm run dev`, open the Admin Overview dashboard, and click the AI report generator — confirm it still produces the formatted HTML report (exercises `handleGenerateReport` → `/api/gemini`). Same caveat as other manual-verification steps: requires `/api/gemini` actually running with a real `GEMINI_API_KEY`.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminOverview.tsx
git commit -m "Point AdminOverview report generator at the Gemini Vercel proxy"
```

---

## After this plan

The `api/` functions exist and are unit-tested, but nothing is deployed yet. To actually run this end-to-end:
1. `npx vercel login`, then `npx vercel link` (creates/links a Vercel project for this repo — needs your Vercel account).
2. `npx vercel env add GEMINI_API_KEY` and `npx vercel env add OPENROUTER_API_KEY` (paste the values; do this for both the "Development" and "Production" environments Vercel prompts for).
3. `npx vercel dev` for local testing (serves the frontend and `api/` functions together, reading env vars from `.env` locally), or `npx vercel deploy` to ship it.

These steps need your Vercel account and API keys, so they're left for you to run rather than scripted here.
