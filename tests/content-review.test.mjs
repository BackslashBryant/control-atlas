import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { learnArticles } from '../src/app/learn-content.mjs';
import { buildTemplateDocument } from '../src/app/template-engine.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(__dirname, '../data/template-registry.json'), 'utf8'));
const appShell = readFileSync('src/ui/App.tsx', 'utf8');

const PROHIBITED_CLAIMS = [
  /guarantees?\s+compliance/i,
  /recommend(s|ation)?\s+(an?\s+)?authorization/i,
  /you\s+(will|should)\s+receive\s+an?\s+ato/i,
  /determines?\s+compliance\s+status/i,
  /makes?\s+authorization\s+decisions/i,
];

const ADVISORY_FIELDS = ['title', 'summary', 'explanation', 'limitations'];
const RAW_SCHEMA_SLUGS = /\b(includePlaceholders|artifact_type|templateType|security_plan_starter|implementation_statement_worksheet)\b/;
const ABSTRACT_SUMMARY_LEADS = /^(understand|leverage|utilize|establish|centralize|facilitate|use task-focused)\b/i;
const DETERMINATION_BOUNDARY = [
  /controls?\s+you\s+can\s+inherit/i,
  /claim\s+the\s+controls?/i,
  /reuse\s+another\s+team['’]s\s+authorization/i,
  /before\s+you\s+inherit/i,
  /assessors?\s+expect/i,
];
const BANNED_SITE_COPY = [
  /the public map for federal cyber compliance/i,
  /like a family tree/i,
  /family tree/i,
  /what do you need to get done/i,
  /start with a compliance task/i,
];

const dataset = {
  nodes: [
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      label: 'AC-2 Account Management',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
  ],
  sources: [
    {
      id: 'nist-oscal',
      display_name: 'SP 800-53 Rev. 5',
      version: '2026-06-09',
    },
  ],
};

test('Learn articles include limitations, citations, and a concrete next action', () => {
  for (const article of learnArticles) {
    assert.ok(article.limitations?.trim(), `Article ${article.id} must include limitations`);
    assert.ok(article.citations?.length, `Article ${article.id} must include citations`);
    assert.ok(article.nextAction?.label, `Article ${article.id} must include a next action`);
  }
});

test('Learn explanation copy avoids prohibited compliance or authorization claims', () => {
  for (const pattern of learnArticles) {
    for (const field of ADVISORY_FIELDS) {
      const text = String(pattern[field] || '');
      for (const claim of PROHIBITED_CLAIMS) {
        assert.doesNotMatch(text, claim, `Pattern ${pattern.id}.${field} contains prohibited claim`);
      }
    }
  }
});

test('Start here is a source navigator without determination questions', () => {
  const startHere = readFileSync('src/ui/pages/StartHerePage.tsx', 'utf8');
  assert.match(startHere, /Find the publication you need/);
  assert.match(startHere, /records and relationships loaded from that\s+publisher/);
  assert.doesNotMatch(startHere, /applicability recommendation|not a framework or baseline/i);
  assert.doesNotMatch(startHere, /System type|Data sensitivity|Operational environment/);
  for (const claim of DETERMINATION_BOUNDARY) {
    assert.doesNotMatch(startHere, claim, `Start Here contains a determination-like claim: ${claim}`);
  }
});

test('site-wide UI copy rule rejects canned metaphors and compliance-only prompts', () => {
  const uiFiles = readdirSync('src/ui', { recursive: true })
    .map(String)
    .filter((path) => /\.(?:ts|tsx|html)$/.test(path))
    .map((path) => readFileSync(`src/ui/${path}`, 'utf8'));
  const siteCopy = [readFileSync('src/index.html', 'utf8'), ...uiFiles].join('\n');
  for (const phrase of BANNED_SITE_COPY) {
    assert.doesNotMatch(siteCopy, phrase, `Banned canned or compliance-only copy: ${phrase}`);
  }
});

// The trunk/limb/twig vocabulary in docs/tree-model.md is how the team reasons
// about the corpus. It is not how a visitor talks, and in 2026-08 it leaked
// into Home, Explore and Start Here as "nine limbs". Internal identifiers keep
// it (atlas:LIMB-*, class names); rendered text must not.
test('the internal tree vocabulary never reaches rendered copy', () => {
  const TREE_WORDS = /\b(limbs?|trunks?|twigs?|acorns?)\b/i;
  const files = readdirSync('src/ui', { recursive: true })
    .map(String)
    .filter((path) => /\.(?:tsx|html)$/.test(path))
    .map((path) => [`src/ui/${path}`, readFileSync(`src/ui/${path}`, 'utf8')]);
  files.push(['src/index.html', readFileSync('src/index.html', 'utf8')]);

  for (const [path, contents] of files) {
    // Strip engineering surface — comments, class names, identifiers and data
    // attributes — leaving the words a visitor actually reads.
    const rendered = contents
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
      .replace(/(?:class|className)=(?:"[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g, ' ')
      .replace(/[A-Za-z_]*(?:LIMB|Limb|limb)[A-Za-z_]*/g, ' ')
      .replace(/treeSpine\.\w+/g, ' ')
      .replace(/data-[\w-]+="[^"]*"/g, ' ');
    const match = rendered.match(TREE_WORDS);
    assert.ok(
      !match,
      `${path} renders the internal tree vocabulary: ${match && match[0]}`,
    );
  }
});

test('Learn summaries name a concrete reading job', () => {
  for (const pattern of learnArticles) {
    const summary = String(pattern.summary || '').trim();
    const wordCount = summary.split(/\s+/).filter(Boolean).length;
    assert.ok(summary, `Pattern ${pattern.id} must have a summary`);
    assert.doesNotMatch(
      summary,
      ABSTRACT_SUMMARY_LEADS,
      `Pattern ${pattern.id} starts with abstract UI copy`,
    );
    assert.ok(
      wordCount <= 20,
      `Pattern ${pattern.id} summary has ${wordCount} words; expected 20 or fewer`,
    );
  }
});

test('template registry requires disclaimers on every artifact', () => {
  for (const template of registry.templates) {
    assert.equal(template.disclaimer_required, true, `${template.name} must require a disclaimer`);
  }
});

test('generated templates use plain-language prompts without raw schema slugs', () => {
  for (const template of registry.templates) {
    const { doc } = buildTemplateDocument(
      {
        templateType: template.name,
        framework: 'nist-800-53',
        environment: 'Cloud SaaS',
        includePlaceholders: true,
        includeImplementationPrompts: true,
        includeSourceFootnotes: true,
      },
      dataset,
    );
    const content = JSON.stringify(doc);

    assert.match(content, /Source Metadata/, `${template.name} must include source metadata`);
    assert.match(content, /Limit:/, `${template.name} must state its limitation`);
    assert.doesNotMatch(content, RAW_SCHEMA_SLUGS, `${template.name} exposes raw schema slug in output`);
    const hasPlainLanguage = /How is|Describe|What|Who|When|Why|List|Document|Assessment Method|Observations|Weakness|Remediation|\[[^\]]+\]/i.test(content);
    assert.ok(hasPlainLanguage, `${template.name} should include plain-language prompts`);
  }
});

test('react shell footer uses the approved open-source guidance disclaimer', () => {
  const footer = readFileSync('src/ui/components/SiteFooter.tsx', 'utf8');
  const identity = readFileSync('src/shared/product-identity.ts', 'utf8');
  assert.match(footer, /PRODUCT_FOOTER_NOTICE/);
  assert.match(identity, /Free and open source, not a government system\. Every record keeps its publisher and source attached\./);
});

test('starter documents use the same direct decision boundary as the public product', () => {
  const disclaimer = readFileSync('src/shared/disclaimer.mjs', 'utf8');
  assert.match(
    disclaimer,
    /The people using it decide what applies, which baseline to use, and what counts for compliance, inheritance, authorization, or an ATO\./,
  );
  assert.doesNotMatch(disclaimer, /owns any .* conclusions/i);
});

test('about page states the exact product boundary without a decorative hierarchy', () => {
  const aboutPage = readFileSync('src/ui/pages/AboutPage.tsx', 'utf8');
  assert.match(appShell, /AboutPage/);
  assert.match(aboutPage, /eyebrow="About"/);
  assert.match(aboutPage, /PRODUCT_DEFINITION/);
  assert.match(aboutPage, /PRODUCT_DECISION_BOUNDARY/);
  assert.match(aboutPage, /Path has two rails/i);
  assert.match(aboutPage, /Control Atlas structure/);
  assert.match(aboutPage, /publisher hierarchy/i);
  assert.match(aboutPage, /A tree for hierarchy, a graph for relationships/);
  assert.doesNotMatch(aboutPage, /\b(?:Roots|Trunk|Twigs|Leaves|Fruit|Acorns)\b/);
  assert.doesNotMatch(aboutPage, /plain English|right starting point/i);
});
