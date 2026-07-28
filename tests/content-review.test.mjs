import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { patternsData } from '../src/app/patterns-data.mjs';
import { buildTemplateDocument } from '../src/app/template-engine.mjs';
import { PRODUCT_DISCLAIMER } from '../src/shared/disclaimer.mjs';

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

const ADVISORY_FIELDS = ['title', 'summary', 'explanation', 'friction'];
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

test('pattern pages include limitations and cautionary donts', () => {
  for (const pattern of patternsData) {
    assert.ok(pattern.limitations?.trim(), `Pattern ${pattern.id} must include limitations`);
    assert.ok(Array.isArray(pattern.donts) && pattern.donts.length > 0, `Pattern ${pattern.id} must include donts`);
  }
});

test('pattern advisory copy avoids prohibited compliance or authorization claims', () => {
  for (const pattern of patternsData) {
    for (const field of ADVISORY_FIELDS) {
      const text = String(pattern[field] || '');
      for (const claim of PROHIBITED_CLAIMS) {
        assert.doesNotMatch(text, claim, `Pattern ${pattern.id}.${field} contains prohibited claim`);
      }
    }
    for (const entry of pattern.dos || []) {
      for (const claim of PROHIBITED_CLAIMS) {
        assert.doesNotMatch(String(entry), claim, `Pattern ${pattern.id}.dos contains prohibited claim`);
      }
    }
  }
});

test('Start Here treats mappings and recommendations as references requiring validation', () => {
  const startHere = readFileSync('src/ui/lib/startHereRecommendations.mjs', 'utf8');
  assert.match(startHere, /candidate overlap/i);
  assert.match(startHere, /confirm .*governing program/i);
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

test('playbook summaries name a concrete task or decision', () => {
  for (const pattern of patternsData) {
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
  assert.match(
    footer,
    /Control Atlas is an open-source reference tool\. It does not replace official guidance\./,
  );
});

test('about page includes full product disclaimer', () => {
  const aboutPage = readFileSync('src/ui/pages/AboutPage.tsx', 'utf8');
  assert.match(appShell, /AboutPage/);
  assert.match(aboutPage, /About & trust/);
  assert.match(aboutPage, /PRODUCT_DISCLAIMER/);
  assert.match(PRODUCT_DISCLAIMER, /not an official government system/i);
  assert.match(PRODUCT_DISCLAIMER, /reference aids based on public sources/i);
});
