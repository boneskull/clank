#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate we're running from clank repository root
validate_clank_repo() {
  if [[ ! -d "skills/meta/installing-skills" ]]; then
    echo -e "${RED}Error: Not running from clank repository root${NC}"
    echo ""
    echo "This script must be run from the clank repository root directory."
    echo ""
    echo "To install clank:"
    echo "  1. Fork and clone:"
    echo "     ${GREEN}gh repo fork obra/clank --clone${NC}"
    echo ""
    echo "  2. Change to clank directory:"
    echo "     ${GREEN}cd clank${NC}"
    echo ""
    echo "  3. Run installer:"
    echo "     ${GREEN}./skills/meta/installing-skills/install.sh${NC}"
    echo ""
    echo "Or without GitHub CLI:"
    echo "  1. Fork https://github.com/obra/clank via web UI"
    echo "  2. Clone: ${GREEN}git clone https://github.com/YOUR_USERNAME/clank.git${NC}"
    echo "  3. ${GREEN}cd clank${NC}"
    echo "  4. ${GREEN}./skills/meta/installing-skills/install.sh${NC}"
    exit 1
  fi
}

# Get absolute path to clank repo
get_repo_path() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS doesn't have realpath by default, use Python
    python3 -c "import os; print(os.path.realpath('.'))"
  else
    realpath .
  fi
}

# Backup existing skills directory if it exists
backup_existing_skills() {
  local skills_dir="$HOME/.claude/skills"

  if [[ -e "$skills_dir" ]]; then
    local timestamp=$(date +%Y-%m-%d-%H%M%S)
    local backup_path="${skills_dir}.backup.${timestamp}"

    echo -e "${YELLOW}Found existing ~/.claude/skills${NC}"
    echo -e "Backing up to: ${backup_path}"

    mv "$skills_dir" "$backup_path"
    echo -e "${GREEN}✓${NC} Backup created"
    echo ""
  fi
}

# Backup existing commands directory if it exists
backup_existing_commands() {
  local commands_dir="$HOME/.claude/commands"

  if [[ -e "$commands_dir" ]]; then
    local timestamp=$(date +%Y-%m-%d-%H%M%S)
    local backup_path="${commands_dir}.backup.${timestamp}"

    echo -e "${YELLOW}Found existing ~/.claude/commands${NC}"
    echo -e "Backing up to: ${backup_path}"

    mv "$commands_dir" "$backup_path"
    echo -e "${GREEN}✓${NC} Backup created"
    echo ""
  fi
}

# Create skills symlink
create_symlink() {
  local repo_path="$1"
  local skills_source="${repo_path}/skills"
  local skills_target="$HOME/.claude/skills"

  # Ensure ~/.claude directory exists
  mkdir -p "$HOME/.claude"

  echo "Creating skills symlink:"
  echo "  ${skills_target} → ${skills_source}"

  ln -s "$skills_source" "$skills_target"
  echo -e "${GREEN}✓${NC} Skills symlink created"
  echo ""
}

# Create commands symlink
create_commands_symlink() {
  local repo_path="$1"
  local commands_source="${repo_path}/commands"
  local commands_target="$HOME/.claude/commands"

  # Check if commands directory exists in repo
  if [[ ! -d "$commands_source" ]]; then
    echo -e "${YELLOW}No commands directory in repo, skipping${NC}"
    echo ""
    return
  fi

  echo "Creating commands symlink:"
  echo "  ${commands_target} → ${commands_source}"

  ln -s "$commands_source" "$commands_target"
  echo -e "${GREEN}✓${NC} Commands symlink created"
  echo ""
}

# Verify tools exist
verify_tools() {
  local repo_path="$1"
  local tools_dir="${repo_path}/skills/bin"

  if [[ -d "$tools_dir" ]]; then
    echo "Tools available at:"
    echo "  ${tools_dir}"
    echo ""
    echo "Add to CLAUDE.md:"
    echo "  skills-search: ${tools_dir}/skills-search"
    echo -e "${GREEN}✓${NC} Tools verified"
    echo ""
  fi
}

# Verify installation
verify_installation() {
  local skills_dir="$HOME/.claude/skills"
  local commands_dir="$HOME/.claude/commands"

  echo "Verifying installation..."

  # Verify skills
  if [[ ! -L "$skills_dir" ]]; then
    echo -e "${RED}✗${NC} ~/.claude/skills is not a symlink"
    exit 1
  fi

  if [[ ! -f "$skills_dir/INDEX.md" ]]; then
    echo -e "${RED}✗${NC} INDEX.md not found in ~/.claude/skills"
    exit 1
  fi

  echo -e "${GREEN}✓${NC} Skills verified"

  # Verify commands (if they exist)
  if [[ -L "$commands_dir" ]]; then
    echo -e "${GREEN}✓${NC} Commands verified"
  fi

  echo ""
}

# Print success message
print_success() {
  local repo_path="$1"

  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Installation complete!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Verify installation:"
  echo "  ${GREEN}ls -la ~/.claude/skills${NC}"
  echo "  ${GREEN}ls -la ~/.claude/commands${NC}"
  echo ""
  echo "Browse available skills:"
  echo "  ${GREEN}grep -r 'when_to_use' ~/.claude/skills/ --include='SKILL.md' | head -10${NC}"
  echo ""
  echo "Available commands:"
  echo "  ${GREEN}ls ~/.claude/commands/${NC}"
  echo ""
  echo "Get started:"
  echo "  ${GREEN}cat ~/.claude/skills/meta/using-skills/SKILL.md${NC}"
  echo ""
  echo "To update later:"
  echo "  ${GREEN}cd ${repo_path}${NC}"
  echo "  ${GREEN}git pull origin main${NC}"
  echo ""
  echo "Repository location: ${repo_path}"
  echo ""
}

# Main installation flow
main() {
  echo ""
  echo "Clank Installation"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  validate_clank_repo

  local repo_path=$(get_repo_path)
  echo "Repository path: ${repo_path}"
  echo ""

  backup_existing_skills
  backup_existing_commands
  create_symlink "$repo_path"
  create_commands_symlink "$repo_path"
  verify_tools "$repo_path"
  verify_installation
  print_success "$repo_path"
}

main "$@"
