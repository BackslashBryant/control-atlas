import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const nightlyWorkflow = readFileSync('.github/workflows/nightly-refresh.yml', 'utf8');
const nightlyQualityWorkflow = readFileSync('.github/workflows/nightly-quality.yml', 'utf8');
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
  assert.ok(existsSync('.gitleaks.toml'));
  const codeql = readFileSync('.github/workflows/codeql.yml', 'utf8');
  const secrets = readFileSync('.github/workflows/secret-scan.yml', 'utf8');
  const gitleaks = readFileSync('.gitleaks.toml', 'utf8');
  assert.match(codeql, /github\/codeql-action\/init@v4/);
  assert.match(codeql, /github\/codeql-action\/analyze@v4/);
  assert.match(codeql, /paths-ignore:[\s\S]*?'docs\/audits\/\*\*'/);
  assert.match(codeql, /group: codeql-\$\{\{ github\.ref \}\}/);
  assert.match(secrets, /gitleaks/gim);
  assert.doesNotMatch(secrets, /paths-ignore:/);
  assert.match(secrets, /group: secret-scan-\$\{\{ github\.ref \}\}/);
  assert.ok(
    gitleaks.includes('data/generated/atlas-neighborhood/.*\\.json'),
    'deterministic public neighborhood shards must retain their scoped false-positive allowlist',
  );
  for (const auditedCommit of [
    '8993f4968ef5e019f6cdffe0d6bffec606f30b38',
    'b50b12894d042dbfe39aefdf0a379780ec483272',
    'a56b5de1b64ad9d10d57b2fb461e8e412d632cca',
    'b03a094863bb7b1a315a1db9cd42aa22621dbd94',
    '15655ec80c838678f4da2da326c5a4c3f3e9c970',
    '61686939ee7ae11a3f11a5b9b83fc7fe8e55939c',
  ]) {
    assert.ok(
      gitleaks.includes(auditedCommit),
      `audited historical false-positive commit ${auditedCommit} must remain explicit`,
    );
  }
});

test('release scripts cover staged builds, static checks, and focused browser smoke', () => {
  assert.equal(typeof packageJson.scripts['build:site'], 'string');
  assert.equal(typeof packageJson.scripts['build:site:incremental'], 'string');
  assert.equal(typeof packageJson.scripts['verify:site-artifact'], 'string');
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
  assert.equal(typeof packageJson.scripts['prepush:audit'], 'string');
  assert.equal(typeof packageJson.scripts['ports:free:win'], 'string');
  assert.equal(typeof packageJson.scripts['test:graph'], 'string');
  assert.match(packageJson.scripts.precommit, /npm run build:site/);
  assert.match(packageJson.scripts.precommit, /npm run verify:quality/);
  assert.match(packageJson.scripts['verify:quality'], /npm run lint/);
  assert.match(packageJson.scripts['verify:quality'], /npm run typecheck/);
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
  assert.match(packageJson.scripts['precommit:incremental'], /build:site:incremental/);
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
  assert.match(ciWorkflow, /npm run build:site:incremental/);
  assert.match(ciWorkflow, /npm run verify:quality/);
  assert.match(ciWorkflow, /npm run test:a11y:smoke/);
  assert.match(ciWorkflow, /npm run test:e2e:smoke/);
  assert.doesNotMatch(ciWorkflow, /npm run sbom:generate/);
  assert.match(pagesWorkflow, /workflows: \[Public Repo Checks\]/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(
    pagesWorkflow,
    /EXPECTED_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/,
  );
  assert.doesNotMatch(pagesWorkflow, /npm run test:a11y/);
  assert.doesNotMatch(pagesWorkflow, /npm run test:e2e/);
  assert.match(nightlyWorkflow, /npm run precommit:incremental/);
});

test('CI reuses prior exact-SHA verification on main and otherwise fails closed', () => {
  assert.match(ciWorkflow, /name: Find reusable exact-SHA verification/);
  assert.match(ciWorkflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(ciWorkflow, /head_sha/);
  assert.match(
    ciWorkflow,
    /Exact-SHA lookup failed; running the full fail-closed gate/,
  );
  assert.match(ciWorkflow, /steps\.reuse\.outputs\.run_id == ''/);
  assert.doesNotMatch(ciWorkflow, /\[skip ci\]/);
});

test('evidence-only changes take a narrow fail-closed check and publish their verified scope', () => {
  assert.ok(existsSync('tools/classify-change-scope.mjs'));
  assert.ok(existsSync('tests/change-scope.test.mjs'));
  assert.ok(existsSync('tests/release-evidence.test.mjs'));
  assert.match(ciWorkflow, /name: Classify changed scope/);
  assert.match(ciWorkflow, /scope\.outputs\.scope == 'evidence-only'/);
  assert.match(ciWorkflow, /git diff --check/);
  assert.match(ciWorkflow, /name: ci-change-scope/);
  assert.match(ciWorkflow, /build_mode/);
});

test('Pages deploys the exact checked artifact without a routine rebuild', () => {
  const liveSmoke = readFileSync('.github/workflows/pages-live-smoke.yml', 'utf8');

  assert.match(pagesWorkflow, /actions\/download-artifact@v8/);
  assert.match(pagesWorkflow, /name: ci-change-scope/);
  assert.match(pagesWorkflow, /needs\.scope\.outputs\.deploy == 'true'/);
  assert.match(pagesWorkflow, /name: site-build/);
  assert.match(pagesWorkflow, /github\.event\.workflow_run\.id/);
  assert.match(pagesWorkflow, /actual_sha=.*release\.json/);
  assert.match(pagesWorkflow, /if: \$\{\{ github\.event_name == 'workflow_dispatch' \}\}[\s\S]*?npm ci/);
  assert.doesNotMatch(pagesWorkflow, /name: Public verification/);
  assert.match(liveSmoke, /name: Check whether Pages actually deployed/);
  assert.match(liveSmoke, /select\(\.name == "deploy"\)/);
  assert.match(liveSmoke, /needs\.gate\.outputs\.run == 'true'/);
  assert.match(liveSmoke, /npm run test:e2e:live/);
  assert.match(liveSmoke, /EXPECTED_DEPLOY_SHA/);
  assert.doesNotMatch(liveSmoke, /npx playwright install chromium/);
});

test('CI builds once, reuses the exact-SHA artifact on main, and omits per-push visual replay', () => {
  assert.match(ciWorkflow, /name: Build site once for this commit/);
  assert.match(ciWorkflow, /name: Download reusable exact-SHA site artifact/);
  assert.match(ciWorkflow, /name: Verify exact-SHA site artifact/);
  assert.match(ciWorkflow, /name: site-build/);
  assert.match(ciWorkflow, /actions\/cache@v5/);
  assert.match(ciWorkflow, /GENERATED_CACHE_HIT/);
  assert.match(ciWorkflow, /Generated data cache unavailable or invalidated; rebuilding deterministically/);
  assert.doesNotMatch(ciWorkflow, /approved-layout-visuals/);
});

test('nightly full verification builds once and shards browser coverage', () => {
  assert.match(nightlyQualityWorkflow, /cron: '37 6 \* \* \*'/);
  assert.equal((nightlyQualityWorkflow.match(/Build once from cached or source data/g) ?? []).length, 1);
  assert.match(nightlyQualityWorkflow, /actions\/cache@v5/);
  assert.match(nightlyQualityWorkflow, /Generated data cache unavailable; rebuilding deterministically/);
  assert.match(nightlyQualityWorkflow, /shard: \[1, 2, 3, 4\]/);
  assert.match(nightlyQualityWorkflow, /--shard=\$\{\{ matrix\.shard \}\}\/4/);
  assert.match(nightlyQualityWorkflow, /PLAYWRIGHT_FULLY_PARALLEL: '1'/);
  assert.match(nightlyQualityWorkflow, /playwright merge-reports/);
  assert.match(nightlyQualityWorkflow, /npm run test:visual/);
  assert.match(nightlyQualityWorkflow, /name: nightly-visual-evidence/);
  assert.match(nightlyQualityWorkflow, /needs: \[e2e, accessibility, visual-review\]/);
  assert.equal((nightlyQualityWorkflow.match(/playwright install --with-deps chromium/g) ?? []).length, 3);
  assert.doesNotMatch(nightlyQualityWorkflow, /container:|mcr\.microsoft\.com\/playwright/);
  assert.match(nightlyQualityWorkflow, /visual-review:[\s\S]*Install package-matched Chromium and system dependencies/);
});

test('browser workflows install Playwright on hosted Ubuntu without containers', () => {
  for (const path of [
    '.github/workflows/nightly-quality.yml',
    '.github/workflows/pages-live-smoke.yml',
    '.github/workflows/update-visual-baselines.yml',
  ]) {
    const workflow = readFileSync(path, 'utf8');
    assert.doesNotMatch(workflow, /container:|mcr\.microsoft\.com\/playwright/);
    assert.match(workflow, /playwright install --with-deps chromium/);
  }
});

test('npm-backed workflows use the official setup-node dependency cache', () => {
  for (const path of [
    '.github/workflows/ci.yml',
    '.github/workflows/codeql.yml',
    '.github/workflows/deployed-lighthouse.yml',
    '.github/workflows/lighthouse-ab.yml',
    '.github/workflows/nightly-refresh.yml',
    '.github/workflows/nightly-quality.yml',
    '.github/workflows/oscal-validation.yml',
    '.github/workflows/pages-live-smoke.yml',
    '.github/workflows/pages.yml',
    '.github/workflows/update-visual-baselines.yml',
  ]) {
    const workflow = readFileSync(path, 'utf8');
    const setupCount = (workflow.match(/actions\/setup-node@v6/g) ?? []).length;
    const cacheCount = (workflow.match(/cache: ['"]npm['"]/g) ?? []).length;
    assert.equal(
      cacheCount,
      setupCount,
      `${path} must cache npm for every setup-node job`,
    );
  }
});

test('direct ship scripts cover push retry, remote checks wait, and main ship flow', () => {
  assert.equal(typeof packageJson.scripts['git:push'], 'string');
  assert.equal(typeof packageJson.scripts['checks:wait'], 'string');
  assert.equal(typeof packageJson.scripts['ship:main'], 'string');
  assert.ok(existsSync('tools/git-push-with-retry.mjs'));
  assert.ok(existsSync('tools/wait-for-checks.mjs'));
  assert.ok(existsSync('tools/ship-to-main.mjs'));
  assert.ok(existsSync('.gitleaks.toml'));
  assert.match(packageJson.scripts['prepush:audit'], /brandRotation\.test\.ts/);
  assert.match(packageJson.scripts['prepush:audit'], /content-review\.test\.mjs/);
  assert.match(packageJson.scripts['prepush:audit'], /style:check/);
  assert.equal(packageJson.scripts['pregit:push'], 'npm run prepush:audit');
  const shipToMain = readFileSync('tools/ship-to-main.mjs', 'utf8');
  assert.match(shipToMain, /run\('npm', \['run', 'prepush:audit'\]\)/);
  assert.match(shipToMain, /classify-change-scope\.mjs/);
  assert.match(shipToMain, /Running the focused release-evidence gate/);
  assert.match(shipToMain, /tests\/release-evidence\.test\.mjs/);
  assert.match(
    shipToMain,
    /Direct ship must start from a verified task branch, not main/,
  );
  assert.match(
    shipToMain,
    /Skipping remote wait \(--no-wait\)\.[\s\S]*?return;[\s\S]*?Fast-forwarding main/,
  );
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
