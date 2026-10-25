import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { FEATURED_TEMPLATE_IDS, featuredTemplates, SITE_TEMPLATES, TEMPLATE_CATEGORIES, categoryFor, isTemplateCategory, templateDemoUrl, templatesIn } from "../lib/site-templates";

test("120 templates in 18 categories, none empty, ids and slugs unique", () => {
  assert.equal(SITE_TEMPLATES.length, 120);
  assert.equal(TEMPLATE_CATEGORIES.length, 18);
  assert.equal(new Set(SITE_TEMPLATES.map((t) => t.id)).size, 120);
  assert.equal(new Set(SITE_TEMPLATES.map((t) => t.slug)).size, 120);
  for (const c of TEMPLATE_CATEGORIES) assert.ok(templatesIn(c.label).length > 0, c.label);
  assert.equal(templatesIn("Home Services & Trades").length, 15);
  for (const t of SITE_TEMPLATES) assert.ok(isTemplateCategory(t.category), t.id);
});

test("every template has a card image in /public/templates (the marketplace image is used where the file is not shipped)", () => {
  for (const t of SITE_TEMPLATES) {
    if (t.thumb.startsWith("/")) assert.ok(existsSync(`public${t.thumb}`), `${t.id} is missing ${t.thumb}`);
    else assert.match(t.thumb, /^https:\/\/uiuxlabz\.github\.io\//);
  }
});

test("demo address is <host>/<slug>/ and category lookup is exact", () => {
  assert.equal(templateDemoUrl({ slug: "hair-salon-html-template" }), "https://uiuxlabz.github.io/hair-salon-html-template/");
  assert.equal(categoryFor("Beauty & Wellness"), "Beauty & Wellness");
  assert.equal(categoryFor("constructor"), "");
  assert.equal(isTemplateCategory("Beauty"), false);
});

test("the home page shows three real templates from three different business types", () => {
  const f = featuredTemplates();
  assert.equal(f.length, 3);
  assert.deepEqual(f.map((t) => t.id), [...FEATURED_TEMPLATE_IDS]);
  assert.equal(new Set(f.map((t) => t.category)).size, 3);
  for (const t of f) assert.ok(SITE_TEMPLATES.includes(t));
});
