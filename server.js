import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your current repo has index.html at the root, not /public
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
  "thumbnail