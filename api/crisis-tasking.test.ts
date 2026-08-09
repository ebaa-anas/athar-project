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
