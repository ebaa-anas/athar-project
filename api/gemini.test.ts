import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMessageMock = vi.fn();
const startChatMock = vi.fn(() => ({ sendMessage: sendMessageMock }));
const getGenerativeModelMock = vi.fn(() => ({ startChat: startChatMock }));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function GoogleGenerativeAI() {
    return { getGenerativeModel: getGenerativeModelMock };
  }),
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
    expect(sendMessageMock).toHaveBeenCalledWith(
      "hello",
      expect.objectContaining({ signal: expect.anything(), timeout: expect.any(Number) })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ text: "mocked reply" });
  });

  it("stops at a 429 instead of burning the budget on other models", async () => {
    sendMessageMock.mockRejectedValue({ status: 429, message: "Resource has been exhausted" });
    const res = mockRes();

    await handler(
      { method: "POST", body: { model: "gemini-2.5-flash", message: "hello" } } as any,
      res
    );

    // 429 is fatal now — a single attempt, no fallthrough to the other models.
    expect(getGenerativeModelMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("falls through to the next model on a 404", async () => {
    sendMessageMock
      .mockRejectedValueOnce({ status: 404, message: "model not found" })
      .mockResolvedValueOnce({ response: { text: () => "second model reply" } });
    const res = mockRes();

    await handler(
      { method: "POST", body: { model: "gemini-2.5-flash", message: "hello" } } as any,
      res
    );

    expect(getGenerativeModelMock).toHaveBeenNthCalledWith(1, { model: "gemini-2.5-flash" });
    expect(getGenerativeModelMock).toHaveBeenNthCalledWith(2, { model: "gemini-flash-latest" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ text: "second model reply" });
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
