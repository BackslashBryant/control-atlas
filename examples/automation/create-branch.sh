#!/bin/bash

# Create Git Branch Script
# Provides fallback for GitHub MCP branch creation

set -e

# Configuration
BRANCH_PREFIX="${BRANCH_PREFIX:-feat}"

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

# Check if git is available
check_git() {
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
}

# Create a new branch
create_branch() {
    local issue_id="$1"
    local slug="$2"
    local branch_name="${BRANCH_PREFIX}/${issue_id}-${slug}"
    
    log_info "Creating branch: ${branch_name}"
    
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
        log_warning "Branch ${branch_name} already exists"
        git checkout "${branch_name}"
        log_info "Switched to existing branch: ${branch_name}"
        return 0
    fi
    
    # Ensure we're on main/master branch
    local current_branch
    current_branch=$(git branch --show-current)
    
    if [ "${current_branch}" != "main" ] && [ "${current_branch}" != "master" ]; then
        log_info "Switching to main branch first"
        git checkout main 2>/dev/null || git checkout master 2>/dev/null || {
            log_error "Could not switch to main or master branch"
            exit 1
        }
    fi
    
    # Pull latest changes
    log_info "Pulling latest changes from remote"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || {
        log_warning "Could not pull latest changes, continuing anyway"
    }
    
    # Create and checkout new branch
    git checkout -b "${branch_name}"
    log_success "Created and checked out branch: ${branch_name}"
}

# Create branch from specific base
create_branch_from_base() {
    local issue_id="$1"
    local slug="$2"
    local base_branch="$3"
    local branch_name="${BRANCH_PREFIX}/${issue_id}-${slug}"
    
    log_info "Creating branch: ${branch_name} from ${base_branch}"
    
    # Check if base branch exists
    if ! git show-ref --verify --quiet "refs/heads/${base_branch}"; then
        log_error "Base branch ${base_branch} does not exist"
        exit 1
    fi
    
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
        log_warning "Branch ${branch_name} already exists"
        git checkout "${branch_name}"
        log_info "Switched to existing branch: ${branch_name}"
        return 0
    fi
    
    # Switch to base branch
    git checkout "${base_branch}"
    
    # Pull latest changes
    log_info "Pulling latest changes from remote"
    git pull origin "${base_branch}" || {
        log_warning "Could not pull latest changes, continuing anyway"
    }
    
    # Create and checkout new branch
    git checkout -b "${branch_name}"
    log_success "Created and checked out branch: ${branch_name} from ${base_branch}"
}

# List available branches
list_branches() {
    log_info "Available branches:"
    git branch -a
}

# Delete branch
delete_branch() {
    local branch_name="$1"
    local force="$2"
    
    log_info "Deleting branch: ${branch_name}"
    
    # Check if branch exists
    if ! git show-ref --verify --quiet "refs/heads/${branch_name}"; then
        log_error "Branch ${branch_name} does not exist"
        exit 1
    fi
    
    # Switch to main/master if we're on the branch to be deleted
    local current_branch
    current_branch=$(git branch --show-current)
    
    if [ "${current_branch}" = "${branch_name}" ]; then
        log_info "Switching to main branch before deletion"
        git checkout main 2>/dev/null || git checkout master 2>/dev/null || {
            log_error "Could not switch to main or master branch"
            exit 1
        }
    fi
    
    # Delete branch
    if [ "${force}" = "true" ]; then
        git branch -D "${branch_name}"
    else
        git branch -d "${branch_name}"
    fi
    
    log_success "Deleted branch: ${branch_name}"
}

# Main function
main() {
    local command="$1"
    
    case "$command" in
        "create")
            check_git
            create_branch "$2" "$3"
            ;;
        "create-from")
            check_git
            create_branch_from_base "$2" "$3" "$4"
            ;;
        "list")
            check_git
            list_branches
            ;;
        "delete")
            check_git
            delete_branch "$2" "$3"
            ;;
        *)
            echo "Usage: $0 {create|create-from|list|delete}"
            echo ""
            echo "Commands:"
            echo "  create <issue-id> <slug>                    Create branch from main/master"
            echo "  create-from <issue-id> <slug> <base>        Create branch from specific base"
            echo "  list                                        List all branches"
            echo "  delete <branch-name> [force]                Delete branch (use 'true' for force)"
            echo ""
            echo "Examples:"
            echo "  $0 create 123 user-authentication"
            echo "  $0 create-from 123 user-auth develop"
            echo "  $0 delete feat/123-user-auth"
            echo "  $0 delete feat/123-user-auth true"
            echo ""
            echo "Environment variables:"
            echo "  BRANCH_PREFIX                              Branch prefix (default: feat)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"