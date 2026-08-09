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
