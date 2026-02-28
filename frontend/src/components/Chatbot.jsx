import { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const styles = {
  toggle: {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #1b5e20, #004d40)",
    color: "#69f0ae",
    fontSize: 24,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(105, 240, 174, 0.35)",
    zIndex: 1500,
  },
  panel: {
    position: "fixed",
    right: 24,
    bottom: 92,
    width: 350,
    height: 500,
    display: "flex",
    flexDirection: "column",
    background: "#0a0f1e",
    border: "1px solid rgba(105,240,174,0.3)",
    borderRadius: 14,
    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
    zIndex: 1500,
    overflow: "hidden",
  },
  header: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(105,240,174,0.2)",
    color: "#69f0ae",
    fontWeight: 700,
    fontSize: 14,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  rowLeft: {
    display: "flex",
    justifyContent: "flex-start",
  },
  rowRight: {
    display: "flex",
    justifyContent: "flex-end",
  },
  botBubble: {
    maxWidth: "85%",
    background: "rgba(255,255,255,0.08)",
    color: "#d6f5de",
    border: "1px solid rgba(105,240,174,0.15)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  userBubble: {
    maxWidth: "85%",
    background: "rgba(27,94,32,0.55)",
    color: "#e8f5e9",
    border: "1px solid rgba(105,240,174,0.35)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  footer: {
    padding: 12,
    borderTop: "1px solid rgba(105,240,174,0.2)",
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    border: "1px solid rgba(105,240,174,0.25)",
    background: "rgba(255,255,255,0.07)",
    color: "#e8f5e9",
    padding: "10px 12px",
    outline: "none",
    fontSize: 13,
  },
  send: {
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #1b5e20, #004d40)",
    color: "#69f0ae",
    fontWeight: 700,
    padding: "0 14px",
    cursor: "pointer",
  },
};

const welcomeMessage =
  "Hi! I'm VoltAI ⚡ Ask me anything about buying energy connections, pricing, or how the grid works.";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: welcomeMessage }]);

  const conversationHistory = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
    [messages]
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const nextHistory = [...conversationHistory, { role: "user", parts: [{ text }] }];
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsTyping(true);

    try {
      const [consumersRes, producersRes, centersRes] = await Promise.all([
        fetch(`${API_BASE}/api/consumers`),
        fetch(`${API_BASE}/api/producers`),
        fetch(`${API_BASE}/api/centers`),
      ]);

      if (!consumersRes.ok || !producersRes.ok || !centersRes.ok) {
        throw new Error("Failed to fetch live marketplace data");
      }

      const [consumersJson, producersJson, centersJson] = await Promise.all([
        consumersRes.json(),
        producersRes.json(),
        centersRes.json(),
      ]);

      const consumersData = JSON.stringify(consumersJson);
      const producersData = JSON.stringify(producersJson);
      const centersData = JSON.stringify(centersJson);

      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in frontend/.env");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: `You are VoltAI, smart assistant for EnergyDAO - a decentralized renewable energy marketplace in India. Be concise, friendly, use ₹ for currency.
Keep all replies under 80 words.

LIVE PLATFORM DATA RIGHT NOW:
Consumers: ${consumersData}
Producers: ${producersData}
Energy Centers: ${centersData}

You help with:
- Connection costs (Household base ₹5000, Industry base ₹15000, plus ₹120 per km distance)
- Producer energy pricing and listings
- Energy center storage and transfers
- How the decentralized marketplace works
- Recommending cheapest energy sources`,
                },
              ],
            },
            contents: nextHistory,
            generationConfig: {
              maxOutputTokens: 300,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error || "VoltAI request failed");
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") ||
        "I could not generate a response right now.";

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      alert(err.message || "Failed to get VoltAI response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I hit a temporary issue fetching live data. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style>{`
        .voltai-dots { display: inline-flex; align-items: center; gap: 4px; }
        .voltai-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #69f0ae;
          animation: voltai-bounce 1s infinite ease-in-out;
        }
        .voltai-dot:nth-child(2) { animation-delay: 0.12s; }
        .voltai-dot:nth-child(3) { animation-delay: 0.24s; }
        @keyframes voltai-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>VoltAI Assistant</div>
          <div style={styles.messages}>
            {messages.map((msg, idx) => (
              <div key={idx} style={msg.role === "user" ? styles.rowRight : styles.rowLeft}>
                <div style={msg.role === "user" ? styles.userBubble : styles.botBubble}>{msg.text}</div>
              </div>
            ))}
            {isTyping && (
              <div style={styles.rowLeft}>
                <div style={styles.botBubble}>
                  <span className="voltai-dots">
                    <span className="voltai-dot" />
                    <span className="voltai-dot" />
                    <span className="voltai-dot" />
                  </span>
                </div>
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask VoltAI..."
            />
            <button style={styles.send} onClick={sendMessage} type="button">
              Send
            </button>
          </div>
        </div>
      )}

      <button style={styles.toggle} onClick={() => setOpen((v) => !v)} type="button" aria-label="Toggle VoltAI chatbot">
        ⚡
      </button>
    </>
  );
}
