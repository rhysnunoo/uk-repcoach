#!/bin/bash
# Script to duplicate us-repcoach as uk-repcoach
# Run this locally on your machine (not in the sandbox)
#
# Prerequisites:
#   - git installed
#   - gh CLI installed and authenticated (or create the repo manually on GitHub)
#
# Usage: bash duplicate-to-uk-repcoach.sh

set -euo pipefail

ORG="MyEdSpaceSysAdmin"
SOURCE_REPO="us-repcoach"
TARGET_REPO="uk-repcoach"

echo "=== Duplicating ${ORG}/${SOURCE_REPO} -> ${ORG}/${TARGET_REPO} ==="

# Step 1: Create the new repository on GitHub (private by default)
echo ""
echo "Step 1: Creating new repository ${ORG}/${TARGET_REPO} on GitHub..."
gh repo create "${ORG}/${TARGET_REPO}" --private --confirm 2>/dev/null || {
    echo "Repository may already exist or gh is not available."
    echo "If the repo doesn't exist yet, create it manually at:"
    echo "  https://github.com/organizations/${ORG}/repositories/new"
    echo "  Name: ${TARGET_REPO}"
    echo "  Visibility: Private"
    echo "  Do NOT initialize with README, .gitignore, or license"
    echo ""
    read -p "Press Enter once the repository is created..."
}

# Step 2: Create a bare clone of the source repository
echo ""
echo "Step 2: Creating bare clone of ${ORG}/${SOURCE_REPO}..."
TMPDIR=$(mktemp -d)
git clone --bare "https://github.com/${ORG}/${SOURCE_REPO}.git" "${TMPDIR}/${SOURCE_REPO}.git"

# Step 3: Mirror push to the new repository
echo ""
echo "Step 3: Mirror-pushing to ${ORG}/${TARGET_REPO}..."
cd "${TMPDIR}/${SOURCE_REPO}.git"
git push --mirror "https://github.com/${ORG}/${TARGET_REPO}.git"

# Step 4: Clean up
echo ""
echo "Step 4: Cleaning up temporary files..."
rm -rf "${TMPDIR}"

echo ""
echo "=== Done! ==="
echo "The repository has been duplicated to: https://github.com/${ORG}/${TARGET_REPO}"
echo ""
echo "All branches, tags, and full commit history have been preserved."
echo "The original repository (${ORG}/${SOURCE_REPO}) has NOT been modified."
