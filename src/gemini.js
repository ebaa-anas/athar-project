export const getAtharResponse = async (messagesHistory, userType) => {

  const API_KEY = "***REMOVED-LEAKED-OPENROUTER-KEY***";
  
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

  // 🧠 Personality
  let userContext = "";

  if (userType === "volunteer") {
    userContext = `
The user is a VOLUNTEER.
Guide them to explore opportunities, improve their profile, and apply to organizations.
`;
  } 
  else if (userType === "organization") {
    userContext = `
The user is an ORGANIZATION.
Help them post opportunities, manage volunteers, and use the platform effectively.
`;
  } 
  else {
    userContext = `
The user is a GUEST.
Explain what Athar is and how to join simply.
`;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Athar Project"
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

${userContext}

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
`
          },

          // 🔥 Memory
          ...messagesHistory
        ]
      })
    });

    const data = await response.json();
    console.log("FULL RESPONSE:", data);

    if (data.error) {
      return "Sorry, I'm having trouble connecting.";
    }

    if (!data.choices || !data.choices.length) {
      return "No response received.";
    }

    let reply = data.choices[0].message.content.trim();

    // ✨
    reply = reply.replace(/^(hello|hi|hey)[!,. ]*/i, "");
    reply = reply.replace(/\n{3,}/g, "\n\n");

    return reply;

  } catch (error) {
    console.error(error);
    return "Connection failed.";
  }
};