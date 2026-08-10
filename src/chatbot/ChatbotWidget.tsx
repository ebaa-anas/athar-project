import { useState, useRef, useEffect } from "react";
// @ts-ignore
import { getAtharResponse } from "../gemini";

type Props = {
  userType: string | null;
};

export default function ChatbotWidget({ userType }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hello 👋 How can Athar Assistant help you today?", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [quickReplies, setQuickReplies] = useState<string[]>([
    "What is Athar?",
    "How to join as volunteer?",
    "Register organization"
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customMessage?: string) => {
  const userMessage = customMessage || input;
  if (!userMessage.trim()) return;

  const msg = userMessage.toLowerCase();

  // Simple greetings are answered locally without calling the AI API
  if (["hi", "hello", "hey"].includes(msg)) {
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput("");

    setMessages(prev => [
      ...prev,
      { text: "Hello 👋 How can I help you today?", isUser: false }
    ]);
    return;
  }

  // Same for this common question, no need to hit the AI API
  if (msg.includes("what is athar")) {
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput("");

    setMessages(prev => [
      ...prev,
      {
        text: "Athar is a web-based platform connecting volunteers with organizations.",
        isUser: false
      }
    ]);
    return;
  }

  const newMessages = [
    ...messages,
    { text: userMessage, isUser: true }
  ];

  setMessages(newMessages);
  setInput("");
  setIsTyping(true);

  try {
    // Convert the message history into the role/content shape the AI API expects
    const formatted = newMessages.map(m => ({
      role: m.isUser ? "user" : "assistant",
      content: m.text
    }));

    // Send the whole conversation, not just the latest message, so the AI keeps context
    const botReply = await getAtharResponse(formatted, userType);

    setMessages(prev => [...prev, { text: botReply, isUser: false }]);

  } catch (error) {
    setMessages(prev => [
      ...prev,
      { text: "Sorry, something went wrong.", isUser: false }
    ]);
  } finally {
    setIsTyping(false);
  }
};

  return (
    <div>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5a4, #14b8a6)",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "24px",
          zIndex: 9999,
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
        }}
      >
        {isOpen ? "✖" : "💬"}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "350px",
            height: "500px",
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            border: "1px solid #e2e8f0"
          }}
        >
          {/* Header */}
          <div style={{
            padding: "16px",
            background: "linear-gradient(135deg, #0ea5a4, #14b8a6)",
            color: "white",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <span>🤖 Athar Assistant</span>
            <span style={{
              fontSize: "11px",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "2px 8px",
              borderRadius: "10px"
            }}>
              {userType || "Guest"}
            </span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: "15px",
            overflowY: "auto",
            backgroundColor: "#f0fdfa",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.isUser ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.isUser ? "18px 18px 0 18px" : "18px 18px 18px 0",
                  background: msg.isUser
                    ? "linear-gradient(135deg, #0ea5a4, #14b8a6)"
                    : "#ffffff",
                  color: msg.isUser ? "white" : "#0f172a",
                  fontSize: "14px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading */}
            {isTyping && (
              <div style={{ display: "flex" }}>
                <div style={{
                  backgroundColor: "#ccfbf1",
                  padding: "10px",
                  borderRadius: "15px",
                  display: "flex",
                  gap: "5px"
                }}>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div style={{
            padding: "10px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSend(reply)}
                style={{
                  backgroundColor: "#e6fffa",
                  border: "1px solid #5eead4",
                  color: "#0f766e",
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            display: "flex",
            padding: "15px",
            borderTop: "1px solid #f1f5f9"
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "10px 15px",
                borderRadius: "25px",
                border: "1px solid #e2e8f0"
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping}
              style={{
                marginLeft: "10px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: isTyping
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #0ea5a4, #14b8a6)",
                color: "white",
                border: "none",
                cursor: "pointer"
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}