import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");

const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

test("robots.txt permite crawlers de IA nas páginas públicas", () => {
  const aiSection = robots.split("# Scrapers agressivos")[0];
  for (const bot of AI_CRAWLERS) {
    assert.match(aiSection, new RegExp(`User-agent: ${bot}`));
  }
  assert.doesNotMatch(aiSection, /^Disallow: \/$/m);
  assert.match(aiSection, /Disallow: \/api\//);
});

test("robots.txt bloqueia rotas internas para todos", () => {
  assert.match(robots, /User-agent: \*\s*\nDisallow: \/api\//);
  assert.match(robots, /Disallow: \/admin\//);
  assert.match(robots, /Disallow: \/auth\//);
});
