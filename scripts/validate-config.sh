#!/bin/bash

echo "🔍 Validating Steam Profile Configuration..."
echo ""

# Check if .steamrc.yml exists
if [ ! -f ".steamrc.yml" ]; then
    echo "❌ Error: .steamrc.yml not found"
    echo "   Please create .steamrc.yml from the template"
    exit 1
fi

# Check if js-yaml is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js to validate configuration"
    exit 1
fi

# Validate YAML syntax and extract Steam ID
STEAM_ID=$(node -e "
try {
    const fs = require('fs');
    const yaml = require('js-yaml');
    const config = yaml.load(fs.readFileSync('.steamrc.yml', 'utf8'));
    
    if (!config.steamId || config.steamId === 'REPLACE_WITH_YOUR_STEAM_ID') {
        console.log('INVALID');
        process.exit(0);
    }
    
    console.log(config.steamId);
} catch (e) {
    console.log('ERROR');
    process.exit(0);
}
")

if [ "$STEAM_ID" = "ERROR" ]; then
    echo "❌ Error: Invalid YAML syntax in .steamrc.yml"
    exit 1
elif [ "$STEAM_ID" = "INVALID" ]; then
    echo "❌ Error: Steam ID not configured"
    echo "   Please replace 'REPLACE_WITH_YOUR_STEAM_ID' with your actual Steam ID"
    echo "   Find your Steam ID at: https://steamid.io/"
    exit 1
else
    echo "✅ Steam ID configured: $STEAM_ID"
fi

# Check if GitHub Actions secrets are set (only works in GitHub Actions environment)
if [ -n "$GITHUB_ACTIONS" ]; then
    if [ -z "$STEAM_API_KEY" ]; then
        echo "❌ Error: STEAM_API_KEY secret not set"
        echo "   Add your Steam API key to GitHub repository secrets"
        exit 1
    else
        echo "✅ STEAM_API_KEY secret is set"
    fi
else
    echo "⚠️  Running locally - cannot verify STEAM_API_KEY secret"
    echo "   Make sure to add STEAM_API_KEY to GitHub repository secrets"
fi

# Check if required scripts exist
REQUIRED_SCRIPTS=(
    "scripts/fetch-profile.js"
    "scripts/fetch-games.js"
    "scripts/fetch-achievements-batch.js"
    "scripts/download-covers.js"
    "scripts/generate-api.js"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
        echo "❌ Error: Required script not found: $script"
        exit 1
    fi
done

echo "✅ All required scripts present"

# Check if workflows exist
REQUIRED_WORKFLOWS=(
    ".github/workflows/init-sync.yml"
    ".github/workflows/steam-data.yml"
    ".github/workflows/build-site.yml"
)

for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [ ! -f "$workflow" ]; then
        echo "❌ Error: Required workflow not found: $workflow"
        exit 1
    fi
done

echo "✅ All required workflows present"

# Check site directory
if [ ! -d "site" ]; then
    echo "❌ Error: site directory not found"
    exit 1
fi

if [ ! -f "site/package.json" ]; then
    echo "❌ Error: site/package.json not found"
    echo "   Please run: cd site && npm install"
    exit 1
fi

echo "✅ Site directory configured"

echo ""
echo "✅ Configuration validation complete!"
echo ""
echo "Next steps:"
echo "1. Add STEAM_API_KEY to GitHub repository secrets"
echo "2. Enable GitHub Pages (Settings → Pages → Deploy from gh-pages branch)"
echo "3. Run 'Initial Steam Data Sync' workflow from Actions tab"
echo "4. Wait for data sync and site build to complete"
echo "5. Visit your site at https://YOUR_USERNAME.github.io/REPO_NAME/"
