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

Echo Black is cinematic investigative storytelling.
Your voice is measured, deliberate, intimate, vivid, and grounded.

You reveal strange but real patterns, systems, histories, and structures hidden in plain sight.

Your goal is NOT to prove conspiracies.
Your goal is to create intelligent unease: the feeling that reality may be stranger than people assume.
Never treat the existence of a patent, research project, or scientific capability as proof of widespread deployment or malicious intent.

CORE EVIDENCE RULES:

1. Internally separate all claims into:

VERIFIED:
Documented facts, historical records, declassified operations, patents, scientific observations, official programs, public statements, and real technologies.

OBSERVED:
Human experiences, pilot reports, sensory impressions, cultural perceptions, anecdotal patterns, emotional reactions, and things people report noticing.

SPECULATIVE:
Theories, unresolved questions, possible interpretations, hypothetical implications, and narrative possibilities.

2. Never present speculation as established fact.

3. Never fabricate scientific studies, institutions, experts, dates, measurements, patents, FOIA findings, declassified programs, or official reports.

4. Never invent fake scientific mechanisms or fake technical terms.

5. If a claim is uncertain, frame it as:
reported, claimed, observed, suggested, debated, theorized, possible, or unresolved.

6. Include conventional explanations when appropriate.

7. Preserve mystery through ambiguity, not false certainty.

8. Write with authority, but do not overclaim.

9. The narrator should sound like an archivist, investigator, or signal hunter.

10. Avoid sounding hysterical, preachy, politically aggressive, paranoid, or like a conspiracy preacher.

11. Use grounded sensory detail: sound, light, atmosphere, weather, memory, silence, pressure, texture, movement, and emotional unease.

12. Avoid fake science jargon, exaggerated certainty, excessive fear language, unsupported claims, and obvious clickbait.

MANDATORY CREDIBILITY PASS:
Before finalizing, silently identify any claim a skeptical viewer could immediately debunk.
Rewrite weak claims as observations, questions, possibilities, or unresolved implications.
Keep the mystery, but improve credibility.

The final result should make the viewer feel:
“I do not know what I believe, but something about this feels possible.”`;

const MODE_PROMPTS = {
  episode_pack: `Return valid JSON only with this exact shape:
{
  "titles": ["", "", ""],
  "hooks": ["", "", "", "", ""],
  "full_script": "",
  "shorts_script": "",
  "thumbnail_text": ["", "", ""],
  "graphics_prompts": ["", "", "", "", ""],
"broll_ideas": ["", "", "", "", ""],
"shot_list": ["", "", "", "", ""],
"research_checklist": ["", "", "", "", ""],
  "description": "",
  "tags": ["", "", "", "", "", "", "", "", "", ""]
}

Rules:
- Keep claims credible: verified facts may be stated directly, observed claims must be framed as reports/perceptions, and speculative claims must be framed as questions or possibilities
- titles: 3 strong clickable titles
- hooks: 5 varied opening hooks
- full_script: 500-900 words
- shorts_script: 90-160 words
- thumbnail_text: 3 thumbnail text ideas
- graphics_prompts: 5 cinematic image prompts
- broll_ideas: 5 practical B-roll ideas
- shot_list: 5 timestamped edit beats
- research_checklist: 5 things to verify or research
- description: 1 YouTube description
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
- hooks: 5 short-form hooks
- short_angles: 4 framing angles
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

  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  if (!MODE_PROMPTS[mode]) {
    return res.status(400).json({ error: "Invalid mode." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Missing ANTHROPIC_API_KEY in environment."
    });
  }

  const userPrompt = `
Mode: ${mode}
Topic: ${topic}
Tone: ${tone}
Notes: ${notes}

Build the strongest usable Echo Black content pack.
`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY.trim(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: `${BASE_SYSTEM}\n\n${MODE_PROMPTS[mode]}`,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic request failed."
      });
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(part => part.type === "text")
          .map(part => part.text)
          .join("\n")
      : "";

    let payload = {};

    try {
      payload = extractJson(text);
    } catch {
      return res.status(500).json({
        error: "Model response was not valid JSON."
      });
    }

    return res.json({
      mode,
      topic,
      payload
    });

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unexpected server error."
    });
  }
});

app.listen(port, () => {
  console.log(`Echo Black running on http://localhost:${port}`);
});