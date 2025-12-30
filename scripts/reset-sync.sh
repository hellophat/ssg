#!/bin/bash

echo "🔄 Resetting sync state..."
echo ""
echo "⚠️  WARNING: This will clear the sync progress and force a fresh data collection."
echo "   All existing data in history/ will be preserved, but the next sync will"
echo "   fetch everything from scratch instead of resuming from last batch."
echo ""

read -p "Are you sure you want to reset sync state? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 0
fi

# Remove sync state file
if [ -f ".sync-state.json" ]; then
    rm .sync-state.json
    echo "✅ Removed .sync-state.json"
else
    echo "ℹ️  No sync state file found"
fi

# Optionally remove all collected data
read -p "Do you also want to remove all collected data? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing all data..."
    
    # Remove history
    if [ -d "history" ]; then
        rm -rf history/*
        echo "✅ Cleared history/"
    fi
    
    # Remove API
    if [ -d "api" ]; then
        rm -rf api/*
        echo "✅ Cleared api/"
    fi
    
    # Remove covers
    if [ -d "site/public/covers" ]; then
        rm -rf site/public/covers/*
        echo "✅ Cleared site/public/covers/"
    fi
    
    echo ""
    echo "✅ All data removed! You can now run a fresh initial sync."
else
    echo ""
    echo "✅ Sync state reset! Next sync will start from the beginning but keep existing data."
fi

echo ""
echo "To start a fresh sync:"
echo "1. Go to Actions tab on GitHub"
echo "2. Select 'Initial Steam Data Sync' workflow"
echo "3. Click 'Run workflow'"
echo "4. Check 'Force complete resync' if needed"
