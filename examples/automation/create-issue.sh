#!/bin/bash

# Create GitHub Issue Script
# Provides fallback for GitHub MCP issue creation

set -e

# Configuration
REPO_OWNER="${GITHUB_REPO_OWNER:-your-username}"
REPO_NAME="${GITHUB_REPO_NAME:-my-project}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is available
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        log_info "Please install GitHub CLI: https://cli.github.com/"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "Not authenticated with GitHub CLI"
        log_info "Please run: gh auth login"
        exit 1
    fi
}

# Create GitHub issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local assignee="$4"
    
    log_info "Creating GitHub issue: ${title}"
    
    # Build gh command
    local cmd="gh issue create --title \"${title}\" --body \"${body}\""
    
    # Add labels if provided
    if [ -n "${labels}" ]; then
        cmd="${cmd} --label \"${labels}\""
    fi
    
    # Add assignee if provided
    if [ -n "${assignee}" ]; then
        cmd="${cmd} --assignee \"${assignee}\""
    fi
    
    # Execute command
    local issue_url
    issue_url=$(eval "${cmd}")
    
    if [ $? -eq 0 ]; then
        log_success "Created GitHub issue: ${issue_url}"
        echo "${issue_url}"
    else
        log_error "Failed to create GitHub issue"
        return 1
    fi
}

# Create issue from template
create_issue_from_template() {
    local template_file="$1"
    local title="$2"
    local labels="$3"
    local assignee="$4"
    
    if [ ! -f "${template_file}" ]; then
        log_error "Template file not found: ${template_file}"
        return 1
    fi
    
    # Read template content
    local body
    body=$(cat "${template_file}")
    
    # Create issue
    create_issue "${title}" "${body}" "${labels}" "${assignee}"
}

# Main function
main() {
    local command="$1"
    
    case "$command" in
        "create")
            check_gh_cli
            create_issue "$2" "$3" "$4" "$5"
            ;;
        "from-template")
            check_gh_cli
            create_issue_from_template "$2" "$3" "$4" "$5"
            ;;
        *)
            echo "Usage: $0 {create|from-template}"
            echo ""
            echo "Commands:"
            echo "  create <title> <body> [labels] [assignee]     Create issue with title and body"
            echo "  from-template <template> <title> [labels] [assignee]  Create issue from template file"
            echo ""
            echo "Examples:"
            echo "  $0 create \"Fix bug in login\" \"Description of the bug\" \"bug,priority:high\" \"@me\""
            echo "  $0 from-template \".github/ISSUE_TEMPLATE/bug_report.md\" \"New bug report\" \"bug\""
            echo ""
            echo "Environment variables:"
            echo "  GITHUB_REPO_OWNER                  Repository owner (default: your-username)"
            echo "  GITHUB_REPO_NAME                   Repository name (default: my-project)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"