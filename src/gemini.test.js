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
