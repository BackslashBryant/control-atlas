import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const nightlyWorkflow = readFileSync('.github/workflows/nightly-refresh.yml', 'utf8');
const e2eConfig = readFileSync('playwright.e2e.config.mjs', 'utf8');
const dependencyReviewWorkflowPath = '.github/workflows/dependency-review.yml';
const dependabotPath = '.github/dependabot.yml';

test('data test runner limits concurrency to avoid worker memory exhaustion', () => {
  assert.match(packageJson.scripts['test:data'], /--test-concurrency=1/);
});

test('security scripts exist for dependency audit and sbom generation', () => {
  assert.equal(typeof packageJson.scripts['audit:deps'], 'string');
  assert.equal(typeof packageJson.scripts['sbom:generate'], 'string');
  assert.ok(existsSync('scripts/security/npm-audit.mjs'));
  assert.ok(existsSync('security/npm-audit-exceptions.json'));
});

test('deploy checks include the dependency audit while SBOM generation stays manual', () => {
  assert.match(ciWorkflow, /npm run audit:deps/);
  assert.doesNotMatch(ciWorkflow, /npm run sbom:generate/);
  assert.match(nightlyWorkflow, /npm run audit:deps/);
});

test('Lighthouse CI remains report-only when synthetic collection is unstable', () => {
  assert.match(
    ciWorkflow,
    /name: Run report-only Lighthouse evidence\s+continue-on-error: true\s+run: npm run test:performance/,
  );
  assert.match(
    ciWorkflow,
    /name: lighthouse-ci-reports\s+path: artifacts\/lighthouse-ci\s+if-no-files-found: warn/,
  );
});

test('security workflows exist for CodeQL and secret scanning', () => {
  assert.ok(existsSync('.github/workflows/codeql.yml'));
  assert.ok(existsSync('.github/workflows/secret-scan.yml'));
  const codeql = readFileSync('.github/workflows/codeql.yml', 'utf8');
  const secrets = readFileSync('.github/workflows/secret-scan.yml', 'utf8');
  assert.match(codeql, /github\/codeql-action\/init@v4/);
  assert.match(codeql, /github\/codeql-action\/analyze@v4/);
  assert.match(secrets, /gitleaks/gim);
});

test('release scripts cover staged builds, static checks, and focused browser smoke', () => {
  assert.equal(typeof packageJson.scripts['build:site'], 'string');
  assert.equal(typeof packageJson.scripts.lint, 'string');
  assert.equal(typeof packageJson.scripts.typecheck, 'string');
  assert.equal(typeof packageJson.scripts['license:check'], 'string');
  assert.equal(typeof packageJson.scripts['test:a11y'], 'string');
  assert.equal(typeof packageJson.scripts['test:a11y:run'], 'string');
  assert.equal(typeof packageJson.scripts['test:e2e'], 'string');
  assert.equal(typeof packageJson.scripts['test:e2e:run'], 'string');
  assert.equal(typeof packageJson.scripts['test:visual'], 'string');
  assert.equal(typeof packageJson.scripts['test:performance'], 'string');
  assert.equal(typeof packageJson.scripts['serve:static'], 'string');
  assert.equal(typeof packageJson.scripts['test:style'], 'string');
  assert.equal(typeof packageJson.scripts['style:check'], 'string');
  assert.equal(typeof packageJson.scripts['test:oscal:independent'], 'string');
  assert.equal(typeof packageJson.scripts['ports:free:win'], 'string');
  assert.equal(typeof packageJson.scripts['test:graph'], 'string');
  assert.match(packageJson.scripts.precommit, /npm run build:site/);
  assert.match(packageJson.scripts.precommit, /npm run lint/);
  assert.match(packageJson.scripts.precommit, /npm run typecheck/);
  assert.equal(typeof packageJson.scripts['test:a11y:smoke'], 'string');
  assert.equal(typeof packageJson.scripts['test:e2e:smoke'], 'string');
  assert.match(packageJson.scripts['test:a11y:smoke'], /a11y: focused Atlas Map/);
  assert.match(packageJson.scripts['test:a11y:smoke'], /a11y: Atlas zero connections/);
  assert.match(packageJson.scripts.precommit, /npm run test:a11y:smoke/);
  assert.match(packageJson.scripts.precommit, /npm run test:e2e:smoke/);
  assert.match(packageJson.scripts.test, /test:graph/);
  assert.ok(existsSync('tsconfig.app.json'));
  assert.match(packageJson.scripts.typecheck, /tsconfig\.app\.json/);
});

test('precommit reuses one build and runs only the focused browser smoke', () => {
  const precommitSteps = packageJson.scripts.precommit
    .split('&&')
    .map((step) => step.trim());

  assert.equal(precommitSteps.filter((step) => step === 'npm run build:site').length, 1);
  assert.ok(precommitSteps.includes('npm run test:a11y:smoke'));
  assert.ok(precommitSteps.includes('npm run test:e2e:smoke'));
  assert.ok(!precommitSteps.includes('npm run test:a11y'));
  assert.ok(!precommitSteps.includes('npm run test:e2e'));
  assert.match(packageJson.scripts['test:a11y'], /build:site.*test:a11y:run/);
  assert.match(packageJson.scripts['test:e2e'], /build:site.*test:e2e:run/);
  assert.match(e2eConfig, /accessibility\.spec\.mjs/);
  assert.match(e2eConfig, /approved-layout-visual\.spec\.mjs/);
});

test('translation-first frontend foundation adds React, Vite, and targeted Radix support', () => {
  assert.equal(typeof packageJson.dependencies.react, 'string');
  assert.equal(typeof packageJson.dependencies['react-dom'], 'string');
  assert.equal(typeof packageJson.dependencies['@radix-ui/react-accordion'], 'string');
  assert.equal(typeof packageJson.devDependencies.vite, 'string');
  assert.equal(typeof packageJson.devDependencies['@vitejs/plugin-react'], 'string');
  assert.equal(typeof packageJson.devDependencies['@types/react'], 'string');
  assert.equal(typeof packageJson.devDependencies['@types/react-dom'], 'string');
  assert.equal(typeof packageJson.devDependencies['@typescript-eslint/eslint-plugin'], 'string');
  assert.equal(typeof packageJson.devDependencies['@typescript-eslint/parser'], 'string');
});

test('Epic 2 data refresh includes official DISA STIG and SRG ingestion', () => {
  assert.equal(typeof packageJson.scripts['refresh:data'], 'string');
  assert.ok(existsSync('scripts/fetch-disa-stigs.mjs'));
  assert.ok(existsSync('scripts/fetch-stig-source-observations.mjs'));
});

test('ci workflows run the epic 0 hardening gates', () => {
  assert.match(ciWorkflow, /npm run build:site/);
  assert.match(ciWorkflow, /npm run lint/);
  assert.match(ciWorkflow, /npm run typecheck/);
  assert.match(ciWorkflow, /npm run test:a11y:smoke/);
  assert.match(ciWorkflow, /npm run test:e2e:smoke/);
  assert.doesNotMatch(ciWorkflow, /npm run sbom:generate/);
  assert.match(pagesWorkflow, /workflows: \[Public Repo Checks\]/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(pagesWorkflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
  assert.match(pagesWorkflow, /npm run build:site/);
  assert.match(pagesWorkflow, /npm run verify:public/);
  assert.doesNotMatch(pagesWorkflow, /npm run test:a11y/);
  assert.doesNotMatch(pagesWorkflow, /npm run test:e2e/);
  assert.match(nightlyWorkflow, /npm run precommit/);
});

test('direct ship scripts cover push retry, remote checks wait, and main ship flow', () => {
  assert.equal(typeof packageJson.scripts['git:push'], 'string');
  assert.equal(typeof packageJson.scripts['checks:wait'], 'string');
  assert.equal(typeof packageJson.scripts['ship:main'], 'string');
  assert.ok(existsSync('tools/git-push-with-retry.mjs'));
  assert.ok(existsSync('tools/wait-for-checks.mjs'));
  assert.ok(existsSync('tools/ship-to-main.mjs'));
  assert.ok(existsSync('.gitleaks.toml'));
});

test('documented port status command checks the Playwright site port', () => {
  assert.equal(typeof packageJson.scripts['ports:status'], 'string');
  const portStatus = readFileSync('tools/ports-status.mjs', 'utf8');
  assert.match(portStatus, /4317/);
  assert.match(portStatus, /LISTENING/);
});

test('dependency review and dependabot automation exist', () => {
  assert.ok(existsSync(dependencyReviewWorkflowPath));
  assert.ok(existsSync(dependabotPath));
  const dependencyReview = readFileSync(dependencyReviewWorkflowPath, 'utf8');
  const dependabot = readFileSync(dependabotPath, 'utf8');
  assert.match(dependencyReview, /dependency-review-action/);
  assert.match(dependabot, /package-ecosystem:\s*"npm"/);
  assert.match(dependabot, /package-ecosystem:\s*"github-actions"/);
});
