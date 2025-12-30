#!/bin/bash

echo "🚀 Starting local Steam data sync..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please copy .env.example to .env and fill in your credentials:"
    echo "   cp .env.example .env"
    exit 1
fi

# Load environment variables from .env
export $(cat .env | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$STEAM_API_KEY" ] || [ "$STEAM_API_KEY" = "your_steam_api_key_here" ]; then
    echo "❌ Error: STEAM_API_KEY not set in .env"
    exit 1
fi

if [ -z "$STEAM_ID" ] || [ "$STEAM_ID" = "your_steam_id_here" ]; then
    echo "❌ Error: STEAM_ID not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   Steam ID: $STEAM_ID"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Step 1: Fetch profile
echo "👤 Fetching Steam profile..."
node scripts/fetch-profile.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch profile"
    exit 1
fi
echo ""

# Step 2: Fetch games
echo "🎮 Fetching owned games..."
node scripts/fetch-games.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch games"
    exit 1
fi
echo ""

# Step 3: Ask user if they want full sync or quick test
read -p "Do you want to fetch all achievements? (takes longer, y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Full achievement sync
    echo "🏆 Fetching achievements (this may take a while)..."
    export RESUME=false
    export LAST_BATCH=0
    node scripts/fetch-achievements-batch.js
    if [ $? -ne 0 ]; then
        echo "⚠️  Achievement fetch had errors, but continuing..."
    fi
    echo ""
    
    # Download covers
    echo "🖼️  Downloading game covers..."
    node scripts/download-covers.js
    if [ $? -ne 0 ]; then
        echo "⚠️  Cover download had errors, but continuing..."
    fi
    echo ""
else
    echo "⏭️  Skipping full achievement sync"
    echo "   (You can run 'node scripts/fetch-achievements-batch.js' later)"
    echo ""
    
    # Just download a few covers for testing
    echo "🖼️  Downloading a few game covers for testing..."
    node scripts/download-covers.js
    echo ""
fi

# Step 4: Fetch recent games
echo "🕐 Fetching recent games..."
node scripts/fetch-recent-games.js
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to fetch recent games, but continuing..."
fi
echo ""

# Step 5: Generate API endpoints
echo "🔧 Generating API endpoints..."
node scripts/generate-api.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate API"
    exit 1
fi
echo ""

# Step 6: Copy history data to site/static directory for dev server
echo "📋 Copying data to site/static directory..."
mkdir -p site/static/history/stats site/static/history/profile site/static/history/games site/static/history/achievements

# Copy stats
if [ -f "history/stats/recent-latest.json" ]; then
    cp history/stats/recent-latest.json site/static/history/stats/
fi

# Copy profile
if [ -f "history/profile/latest.json" ]; then
    cp history/profile/latest.json site/static/history/profile/
fi

# Copy games
if [ -f "history/games/latest.json" ]; then
    cp history/games/latest.json site/static/history/games/
fi

# Copy achievements if they exist
if [ -f "history/achievements/summary.json" ]; then
    cp history/achievements/summary.json site/static/history/achievements/
fi

echo "✅ Data copied to site/static directory"
echo ""

echo "✅ Local data sync complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Your Steam profile should be displayed!"
echo ""
echo "To update data later, run this script again: ./scripts/sync-local.sh"
