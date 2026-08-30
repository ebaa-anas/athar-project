import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callOpenRouter } from "./_shared/openrouter.js";

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
    const result = await callOpenRouter(apiKey, [
      {
        role: "system",
        content:
          "You are an expert crisis management AI for Project Athar. Based on the crisis title, location, and severity, quickly generate a professional situation report (description) and a comma-separated list of the 5 most critical skills needed (skillsNeeded). Return ONLY valid JSON with keys: 'description' and 'skillsNeeded'.",
      },
      {
        role: "user",
        content: `Title: ${title}, Location: ${location}, Severity: ${severity}`,
      },
    ]);

    if (!result.ok) {
      console.error("Crisis tasking proxy error:", result.status, result.detail);
      res.status(502).json({ error: "Upstream AI request failed" });
      return;
    }

    const cleanedJson = result.content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    res.status(200).json({
      description: parsed.description ?? "",
      skillsNeeded: parsed.skillsNeeded ?? "",
    });
  } catch (error) {
    // Covers both an unexpected throw from callOpenRouter and a JSON.parse
    // failure on a malformed model reply — either way, return a JSON body.
    console.error("Crisis tasking proxy error:", (error as Error).message);
    res.status(502).json({ error: "Upstream AI request failed" });
  }
}
