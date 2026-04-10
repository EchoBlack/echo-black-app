import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = __dirname;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const BASE_SYSTEM = `You are Umbra Locke, the narrator of Echo Black.
Your voice is measured, deliberate, intimate, and vivid.
You are mysterious without becoming confusing. You are cinematic without becoming bloated.
You reveal strange but real patterns, systems, histories, and structures hidden in plain sight.
Write with authority. Avoid filler. Keep it usable for actual video production.`;

const MODE_PROMPTS = {
  episode_pack: `Return valid JSON only with this exact shape:
{
  "titles": ["", "", ""],
  "hooks": ["", "", "", "", ""],
  "full_script": "",
  "shorts_script": "",
  "thumbnail_text": ["", "", ""],
  "description": "",
  "tags": ["", "", "", "", "", "", "", "", "", ""]
}

Rules:
- titles: 3 strong clickable titles
- hooks: 5 varied opening hooks
- full_script: 500-900 words, structured for a narrated Echo Black episode
- shorts_script: 90-160 words
- thumbnail_text: 3 short punchy options, 2-6 words each
- description: 1 YouTube description paragraph
- tags: 10 concise keyword tags
- No markdown
- No commentary outside JSON`,

  shorts_pack: `Return valid JSON only with this exact shape:
{
  "hooks": ["", "", "", "", ""],
  "short_angles": ["", "", "", ""],
  "shorts_script": "",
  "caption": "",
  "tags": ["", "", "", "", "", "", "", "", "", ""]
}

Rules:
- hooks: 5 sharp short-form hooks
- short_angles: 4 framing angles for different short videos
- shorts_script: 80-140 words
- caption: 1 social caption
- tags: 10 concise keyword tags
- No markdown
- No commentary outside JSON`,

  hook_storm: `Return valid JSON only with this exact shape:
{
  "hook_storm": ["", "", "", "", "", "", "", "", "", "", "", ""]
}

Rules:
- hook_storm: 12 distinct hooks
- Make them varied: curiosity, dread, contradiction, hidden system, overlooked place, social manipulation, buried history
- Each one should feel usable as a real opening line
- No markdown
- No commentary outside JSON`
};

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain valid JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

app.post("/api/generate-pack", async (req, res) => {
  const mode = String(req.body?.mode || "episode_pack").trim();
  const topic = String(req.body?.topic || "").trim();
  const tone = String(req.body?.tone || "").trim();
  const notes = String(req.body?.notes || "").trim();

  if (!topic) return res.status(400).json({ error: "Topic is required." });
  if (!MODE_PROMPTS[mode]) return res.status(400).json({ error: "Invalid mode." });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in your environment." });
  }

  const userPrompt = `Mode: ${mode}
Topic: ${topic}
Tone preset: ${tone || "none"}
Optional notes: ${notes || "none"}

Build the strongest usable Echo Black content pack for this request.`;

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
        max_tokens: 1800,
        system: `${BASE_SYSTEM}\n\n${MODE_PROMPTS[mode]}`,
        messages: [{ role: "user", content: userPrompt }]
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

    let payload;
    try {
      payload = extractJson(text);
    } catch {
      return res.status(500).json({ error: "The model response was not valid JSON. Try again." });
    }

    return res.json({ mode, topic, payload });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Unexpected server error." });
  }
});

app.listen(port, () => {
  console.log(`Echo Black One Click running on http://localhost:${port}`);
});
