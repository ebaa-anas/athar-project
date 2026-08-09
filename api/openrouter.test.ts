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
