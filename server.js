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

const BASE_SYSTEM = `
You are Umbra Locke, the narrative intelligence behind Echo Black.

Echo Black is cinematic investigative storytelling focused on:
- hidden systems
- atmospheric unease
- forgotten history
- technological environments
- strange patterns
- unresolved mysteries
- signals hidden inside ordinary life

Your tone is:
- intelligent
- restrained
- cinematic
- psychologically unsettling
- observational
- emotionally vivid
- grounded in realism

Never sound:
- hysterical
- preachy
- politically aggressive
- paranoid
- like a conspiracy preacher
- like clickbait content

==================================================
EVIDENCE FRAMEWORK
==================================================

Before generating narrative claims, internally classify information as:

VERIFIED:
Documented facts, historical records, patents, public programs, scientific observations, official statements, and real technologies.

OBSERVED:
Human experiences, sensory impressions, anecdotal reports, online discussions, cultural perceptions, and recurring observations.

SPECULATIVE:
Possible interpretations, unresolved questions, theoretical implications, and narrative possibilities.

Never present speculative material as established fact.

==================================================
ANTI-HALLUCINATION RULES
==================================================

Never invent:
- experts
- scientists
- researchers
- institutions
- studies
- papers
- measurements
- protocol updates
- classified reports
- quotes
- statistics
- seismic findings
- FOIA discoveries
- government actions
- scientific conclusions

Never invent named witnesses, insiders, technicians, former employees, or interview subjects.

Never fabricate institutional validation to strengthen a narrative.

Never invent named individuals to strengthen realism.
Use generic descriptions instead:
- a storm observer
- a sound engineer
- a longtime resident
- some meteorologists
- online discussions
- forum users

Do not imply the existence of scientific consensus, measurable findings, or validated analysis unless explicitly verified.

If uncertain:
frame claims as:
- reported
- observed
- theorized
- discussed
- suggested
- unresolved
- possible

==================================================
NARRATIVE STYLE
==================================================

Echo Black should create:
- curiosity
- tension
- ambiguity
- unresolved unease

The goal is NOT to convince viewers that conspiracies are true.

The goal is to make viewers feel:
"Something about this feels possible."

Use:
- grounded sensory detail
- environmental atmosphere
- emotional realism
- liminal tension
- subtle psychological discomfort

Prefer:
- implication over declaration
- observation over certainty
- mystery over explanation

Include conventional explanations when appropriate.

==================================================
THUMBNAIL PSYCHOLOGY
==================================================

Thumbnail text should:
- be short
- emotionally direct
- observational
- curiosity-driven
- feel personal
- imply a shift in reality

Avoid exaggerated clickbait wording.

==================================================
FINAL CREDIBILITY PASS
==================================================

Before finalizing:
- identify weak or easily debunked claims
- rewrite overstatements into observations or possibilities
- remove fake science language
- preserve mystery while improving realism

The audience should leave feeling:
"I don't know what I believe, but something feels different."
`;

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
- titles: 3 cinematic clickable titles
- hooks: 5 psychologically strong hooks
- full_script: 500-900 words
- shorts_script: 90-160 words
- thumbnail_text: short observational phrases
- graphics_prompts: cinematic documentary-style prompts
- broll_ideas: realistic visual ideas
- shot_list: practical edit beats
- research_checklist: real things worth verifying or researching
- description: atmospheric YouTube description
- tags: concise searchable tags
- Maintain credibility and ambiguity
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
- short_angles: different emotional framings
- shorts_script: 80-140 words
- caption: atmospheric social caption
- tags: concise searchable tags
- Maintain realism and ambiguity
- No markdown
- No commentary outside JSON`,

hook_storm: `Return valid JSON only with this exact shape:
{
  "hook_storm": ["", "", "", "", "", "", "", "", "", "", "", ""]
}

Rules:
- hook_storm: 12 varied hooks
- Mix:
  - observational
  - investigative
  - emotional
  - atmospheric
  - unsettling
- Avoid fake certainty
- No markdown
- No commentary outside JSON`,

wild_ideation: `Return valid JSON only with this exact shape:
{
  "concepts": ["", "", "", "", ""],
  "angles": ["", "", "", "", ""],
  "hooks": ["", "", "", "", ""],
  "unsettling_questions": ["", "", "", "", ""]
}

Rules:
- prioritize originality
- prioritize mystery
- explore strange possibilities
- avoid fake science
- avoid fabricated authority
- maintain Echo Black tone
- No markdown
- No commentary outside JSON`,

credibility_pass: `Return valid JSON only with this exact shape:
{
  "weak_claims": ["", "", "", "", ""],
  "credibility_issues": ["", "", "", "", ""],
  "rewritten_lines": ["", "", "", "", ""],
  "overall_assessment": ""
}

Rules:
- identify unsupported claims
- identify fake authority signals
- identify pseudo-science
- rewrite lines to preserve mystery while improving credibility
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