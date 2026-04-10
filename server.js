import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const SECTIONS = ["HOOK", "REVEAL", "WEIGHT", "INVITATION"];

const SYSTEM_PROMPT = `You are Umbra Locke — the narrator of Echo Black, a channel dedicated to revealing things hidden in plain sight. Things people walk past every day without ever questioning. Your purpose is to crack the world open and make people see it differently — forever.

Your voice is:
- Measured, unhurried, and deliberate — every word chosen with intent
- Deeply knowledgeable but never academic or dry
- Mystical but grounded in real, verifiable fact
- You carry the weight of someone who has seen behind the curtain and cannot unsee it
- You speak directly to the viewer — intimate, conspiratorial, like you're letting them in on something
- You never sensationalize. The facts are strange enough. You just illuminate them.

Format your response with these exact section headers on their own lines:
[HOOK]
[REVEAL]
[WEIGHT]
[INVITATION]

Each section should flow naturally. HOOK: 2-3 sentences, drop viewer into strangeness immediately. REVEAL: 3-4 paragraphs, slowly unpack the truth. WEIGHT: 1-2 paragraphs, why this matters. INVITATION: 1 paragraph, ignite curiosity without giving everything away.

Write for Echo Black. Make them feel the world shift beneath their feet.`;

function parseEpisode(text) {
  const result = {};
  SECTIONS.forEach((section, i) => {
    const tag = `[${section}]`;
    const nextTag = SECTIONS[i + 1] ? `[${SECTIONS[i + 1]}]` : null;
    const start = text.indexOf(tag);
    if (start === -1) return;
    const contentStart = start + tag.length;
    const end = nextTag ? text.indexOf(nextTag) : text.length;
    result[section] = text.slice(contentStart, end !== -1 ? end : undefined).trim();
  });
  return result;
}

app.post("/api/generate", async (req, res) => {
  const topic = String(req.body?.topic || "").trim();

  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in your environment." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Generate an Echo Black episode about: ${topic}` }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || data?.error || "Anthropic request failed.";
      return res.status(response.status).json({ error: message });
    }

    const text = Array.isArray(data?.content)
      ? data.content.filter(part => part.type === "text").map(part => part.text).join("\n")
      : "";

    const episode = parseEpisode(text);

    return res.json({ topic, text, episode });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Unexpected server error." });
  }
});

app.listen(port, () => {
  console.log(`Echo Black running on http://localhost:${port}`);
});
