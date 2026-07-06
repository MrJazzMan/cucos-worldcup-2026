import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalPathForRequest,
  canonicalUrl,
  getSiteUrl,
} from "../src/lib/site-metadata.ts";

test("canonicalUrl gera URL absoluta", () => {
  assert.equal(getSiteUrl(), "https://wc26.pt");
  assert.equal(canonicalUrl("/"), "https://wc26.pt");
  assert.equal(canonicalUrl("/grupos"), "https://wc26.pt/grupos");
});

test("canonicalPathForRequest mapeia alias eliminatorias", () => {
  assert.equal(canonicalPathForRequest("/eliminatorias"), "/fasefinal");
  assert.equal(canonicalPathForRequest("/admin"), null);
  assert.equal(canonicalPathForRequest("/privacidade"), "/privacidade");
});
