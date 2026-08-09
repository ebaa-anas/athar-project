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
