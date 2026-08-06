# Cursor Agent Workspace Initialization Script
# Sets up baseline tooling for the Cursor sequential agent workflow

Write-Host "Initializing Cursor Agent Workspace..." -ForegroundColor Blue

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "Project root detected" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm detected: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install --ignore-scripts --no-audit --no-fund
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Run preflight checks
Write-Host "Running preflight (agent workflow guardrails)..." -ForegroundColor Yellow
try {
    npm run preflight
    Write-Host "Preflight passed" -ForegroundColor Green
} catch {
    Write-Host "Preflight failed. Review the output above." -ForegroundColor Red
    exit 1
}

# Offer to install hook
Write-Host "Installing optional path-scope pre-commit hook (if git repo exists)..." -ForegroundColor Yellow
try {
    if (Test-Path ".git") {
        npm run agents:install-hook | Write-Host
        Write-Host "Hook installation attempt complete (no-op if hook already existed)" -ForegroundColor Green
    } else {
        Write-Host "No .git directory found. Skip hook installation." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Hook installation raised a warning but the workflow can continue." -ForegroundColor Yellow
}

# Display next steps
Write-Host ""
Write-Host "Project initialization completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Update the project name and description in package.json" -ForegroundColor White
Write-Host "  2. Configure your repository settings in .cursor/mcp.json" -ForegroundColor White
Write-Host "  3. Export GITHUB_TOKEN (repo + workflow scopes) and run npm run github:labels" -ForegroundColor White
Write-Host "  4. Run npm run agents:prompt -- list to copy prompts into Cursor agents" -ForegroundColor White
Write-Host "  5. Kick off a feature using docs/agents/KICKOFF.md" -ForegroundColor White
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Blue
Write-Host "  npm run preflight        - Validate agent workflow scaffolding" -ForegroundColor White
Write-Host "  npm run agents:prompt -- all - Print prompts for every agent" -ForegroundColor White
Write-Host "  npm run agents:install-hook  - Copy optional path-scope hook" -ForegroundColor White
Write-Host "  npm run github:labels   - Sync recommended GitHub labels (requires GITHUB_TOKEN)" -ForegroundColor White
Write-Host "  npm run github:issue -- kickoff \"Title\" - Open issues from the CLI (requires GITHUB_TOKEN)" -ForegroundColor White
Write-Host "  npm run verify           - Run verify-all once your stack adds scripts" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Blue
Write-Host "  docs/agents/README.md   - Agent roster and run order" -ForegroundColor White
Write-Host "  docs/agents/SETUP.md    - Agent provisioning checklist" -ForegroundColor White
Write-Host "  docs/agents/KICKOFF.md  - Kickoff template + sanity test" -ForegroundColor White
Write-Host "  docs/github/README.md   - GitHub workflow checklist" -ForegroundColor White
Write-Host "  docs/PRD.md             - Product requirements placeholder" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
