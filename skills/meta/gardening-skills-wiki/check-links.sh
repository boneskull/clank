#!/bin/bash
# Check for broken, invalid, or non-standard links in skills wiki

SKILLS_DIR="${1:-$HOME/Documents/GitHub/dotfiles/.claude/skills}"

echo "## Links & References"
broken_refs=0
backticked_refs=0
relative_refs=0

while IFS= read -r file; do
    # Extract @ references - must start line, be after space/paren/dash, or be standalone
    # Exclude: emails, decorators, code examples with @staticmethod/@example

    # First, check for backtick-wrapped @ links
    grep -nE '`[^`]*@[a-zA-Z0-9._~/-]+\.(md|sh|ts|js|py)[^`]*`' "$file" | while IFS=: read -r line_num match; do
        # Get actual line to check if in code block
        actual_line=$(sed -n "${line_num}p" "$file")

        # Skip if line is indented (code block) or in fenced code
        if [[ "$actual_line" =~ ^[[:space:]]{4,} ]]; then
            continue
        fi

        code_block_count=$(sed -n "1,${line_num}p" "$file" | grep -c '^```')
        if [ $((code_block_count % 2)) -eq 1 ]; then
            continue
        fi

        ref=$(echo "$match" | grep -o '@[a-zA-Z0-9._~/-]*\.[a-zA-Z0-9]*')
        echo "  ❌ BACKTICKED: $ref on line $line_num"
        echo "     File: $(basename $(dirname "$file"))/$(basename "$file")"
        echo "     Fix: Remove backticks - use bare @ reference"
        backticked_refs=$((backticked_refs + 1))
    done

    # Extract @ references for validation
    grep -E '(^|[ \(>-])@[a-zA-Z0-9._/-]+\.(md|sh|ts|js|py)' "$file" | \
        grep -v '@[a-zA-Z0-9._%+-]*@' | \
        grep -v 'email.*@' | \
        grep -v '`.*@.*`' | \
        grep -o '@[a-zA-Z0-9._/-]+\.(md|sh|ts|js|py)' | while read -r ref; do
        # Remove leading @
        ref_path="${ref#@}"

        # Check for relative paths (should use @skills/ instead)
        if [[ "$ref_path" == ../* ]] || [[ "$ref_path" == ~/* ]]; then
            echo "  ❌ RELATIVE: $ref in $(basename $(dirname "$file"))/$(basename "$file")"
            echo "     Fix: Use @skills/ absolute path instead"
            relative_refs=$((relative_refs + 1))
            continue
        fi

        # Should start with skills/ for absolute path
        if [[ "$ref_path" == skills/* ]]; then
            # Absolute reference - resolve from skills root
            full_path="$SKILLS_DIR/${ref_path#skills/}"
        else
            # Assume relative to current file's directory
            file_dir=$(dirname "$file")
            full_path="$file_dir/$ref_path"
        fi

        # Normalize path
        full_path=$(cd "$(dirname "$full_path")" 2>/dev/null && pwd)/$(basename "$full_path") 2>/dev/null

        # Check if target exists
        if [[ ! -e "$full_path" ]]; then
            echo "  ❌ BROKEN: $ref in $(basename $(dirname "$file"))/$(basename "$file")"
            echo "     Target: $full_path"
            broken_refs=$((broken_refs + 1))
        fi
    done
done < <(find "$SKILLS_DIR" -type f -name "*.md")

# Summary
total_issues=$((broken_refs + backticked_refs + relative_refs))
if [ $total_issues -eq 0 ]; then
    echo "  ✅ All @ references OK"
else
    [ $backticked_refs -gt 0 ] && echo "  ❌ $backticked_refs backticked @ links (remove backticks)"
    [ $relative_refs -gt 0 ] && echo "  ❌ $relative_refs relative paths (use @skills/path instead)"
    [ $broken_refs -gt 0 ] && echo "  ❌ $broken_refs broken references"
fi

echo ""
echo "Correct format: @skills/category/skill-name/SKILL.md"
echo "  ❌ Bad:  \`@skills/path\` or @../path or @~/path"
echo "  ✅ Good: @skills/path"

echo ""
# Verify all skills mentioned in INDEX files exist
find "$SKILLS_DIR" -type f -name "INDEX.md" | while read -r index_file; do
    index_dir=$(dirname "$index_file")

    # Extract skill references (format: @skill-name/SKILL.md)
    grep -o '@[a-zA-Z0-9-]*/SKILL\.md' "$index_file" | while read -r skill_ref; do
        skill_path="$index_dir/${skill_ref#@}"

        if [[ ! -f "$skill_path" ]]; then
            echo "  ❌ BROKEN: $skill_ref in $(basename "$index_dir")/INDEX.md"
            echo "     Expected: $skill_path"
        fi
    done
done

echo ""
find "$SKILLS_DIR" -type f -path "*/*/SKILL.md" | while read -r skill_file; do
    skill_dir=$(basename $(dirname "$skill_file"))
    category_dir=$(dirname $(dirname "$skill_file"))
    index_file="$category_dir/INDEX.md"

    if [[ -f "$index_file" ]]; then
        if ! grep -q "@$skill_dir/SKILL.md" "$index_file"; then
            echo "  ⚠️  ORPHANED: $skill_dir/SKILL.md not in $(basename "$category_dir")/INDEX.md"
        fi
    fi
done
