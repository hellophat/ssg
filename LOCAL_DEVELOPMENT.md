# Local Development Guide

Test the Steam Profile Static Site Generator locally without GitHub Actions!

## Quick Setup (5 minutes)

### 1. Create Environment File

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
STEAM_API_KEY=your_actual_steam_api_key
STEAM_ID=your_actual_steam_id
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Sync Data Locally

Run the local sync script:

```bash
chmod +x scripts/sync-local.sh
./scripts/sync-local.sh
```

This will:
- ✅ Fetch your Steam profile
- ✅ Fetch your games library
- ✅ Optionally fetch achievements (you can skip for faster testing)
- ✅ Download game cover images
- ✅ Generate API endpoints

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## Local Development Workflow

### Full Data Sync

```bash
./scripts/sync-local.sh
```

Choose "Yes" when asked about achievements for complete data.

### Quick Test Sync (Skip Achievements)

```bash
./scripts/sync-local.sh
```

Choose "No" to skip achievements - much faster for testing UI changes.

### Individual Script Execution

You can run scripts individually for testing:

```bash
# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Fetch profile only
node scripts/fetch-profile.js

# Fetch games only
node scripts/fetch-games.js

# Fetch achievements (full)
node scripts/fetch-achievements-batch.js

# Fetch recent games
node scripts/fetch-recent-games.js

# Check for new games
node scripts/check-new-games.js

# Update achievements for active games
node scripts/update-achievements.js

# Download covers
node scripts/download-covers.js

# Generate API endpoints
node scripts/generate-api.js
```

### Update Data During Development

```bash
# Quick update (profile + recent games)
export $(cat .env | grep -v '^#' | xargs)
node scripts/fetch-profile.js && \
node scripts/fetch-recent-games.js && \
node scripts/generate-api.js
```

The dev server will hot-reload automatically!

## Development Server Features

### Hot Module Replacement

The SvelteKit dev server supports HMR - edit any `.svelte` file and see changes instantly without refresh!

### URL Parameters Testing

Test iframe parameters locally:

```
http://localhost:5173/?theme=dark
http://localhost:5173/?theme=light&compact=true
http://localhost:5173/?hideHeader=true
http://localhost:5173/games/1/?sort=name&filter=counter
http://localhost:5173/game/440/
http://localhost:5173/stats/
```

### Mobile Testing

Access from your phone on the same network:

1. Find your local IP: `ip addr show` or `ifconfig`
2. Visit `http://YOUR_LOCAL_IP:5173` from phone

## Building for Production

### Build Static Site

```bash
npm run build
```

Output will be in `site/build/`

### Preview Production Build

```bash
npm run preview
```

Opens production build at http://localhost:4173

## Project Scripts

### Root Package.json

```bash
npm run validate    # Validate configuration
npm run reset       # Reset sync state
npm run dev         # Start dev server
npm run build       # Build production site
npm run preview     # Preview production build
```

### Site Package.json (in site/ directory)

```bash
cd site
npm run dev         # Dev server
npm run build       # Build site
npm run preview     # Preview build
npm run check       # Type checking
```

## Troubleshooting

### Port Already in Use

If port 5173 is busy:

```bash
npm run dev -- --port 3000
```

### Missing Data

If pages show "Setup Required":

1. Ensure you ran `./scripts/sync-local.sh`
2. Check that `history/` and `api/` directories have JSON files
3. Try running sync script again

### API Errors

- **Rate limiting**: Add delays between requests in `.env`
- **Invalid API key**: Double-check your Steam API key
- **Private profile**: Ensure your Steam profile is public

### Images Not Loading

- Run `node scripts/download-covers.js` again
- Check `site/public/covers/` directory has .jpg files
- Some games don't have cover images on Steam CDN

## File Watching

The dev server watches:
- `site/src/**` - Svelte components and pages
- `site/static/**` - Static assets
- `history/**` and `api/**` - Data files (restart dev server to reload)

To reload data changes without restarting:
- Refresh the browser
- Or edit a `.svelte` file to trigger HMR

## Local vs GitHub Actions Differences

| Feature | Local Dev | GitHub Actions |
|---------|-----------|----------------|
| Data fetch | Manual (`./scripts/sync-local.sh`) | Automatic (every 30 min) |
| Environment | `.env` file | GitHub Secrets |
| Base path | `/` | `/project_2912` |
| Build trigger | Manual (`npm run build`) | Automatic on data push |
| Deployment | Local (`npm run preview`) | GitHub Pages |

## Testing Iframe Embedding Locally

Create a test HTML file:

```html
<!-- test-iframe.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Iframe Test</title>
</head>
<body>
    <h1>Iframe Embedding Test</h1>
    
    <h2>Default</h2>
    <iframe src="http://localhost:5173/" width="800" height="600"></iframe>
    
    <h2>Dark + Compact</h2>
    <iframe src="http://localhost:5173/?theme=dark&compact=true" width="800" height="500"></iframe>
    
    <h2>Light + No Header</h2>
    <iframe src="http://localhost:5173/?theme=light&hideHeader=true" width="800" height="600"></iframe>
</body>
</html>
```

Open in browser: `file:///path/to/test-iframe.html`

## Performance Testing

### Build Analysis

```bash
cd site
npm run build
```

Check build output for:
- Total page count
- Bundle sizes
- Build time

### Local Production Server

```bash
npm run build
npm run preview
```

Test production performance at http://localhost:4173

## Tips for Efficient Development

### 1. Skip Achievements During UI Development

```bash
# Fast sync for UI testing
./scripts/sync-local.sh  # Choose "No" for achievements
```

### 2. Use Git to Track Data Changes

```bash
git status  # See what data changed
git diff history/profile/latest.json  # See profile changes
```

### 3. Mock Data for Testing

Create test data in `history/` for edge cases without hitting Steam API.

### 4. Component Development

Edit components in `site/src/routes/` and see instant updates!

### 5. Style Tweaking

Edit `site/src/app.css` for global styles - changes apply immediately.

## Next Steps After Local Testing

Once you're happy with local testing:

1. Push your changes to GitHub
2. Set up GitHub Actions secrets
3. Enable GitHub Pages
4. Run the initial sync workflow
5. Your site goes live!

The local and production versions will be identical.

## Common Local Development Tasks

### Add a New Page

```bash
# Create new route
mkdir -p site/src/routes/my-page
touch site/src/routes/my-page/+page.svelte

# SvelteKit auto-detects it!
# Visit: http://localhost:5173/my-page
```

### Modify Styles

```bash
# Edit global styles
vim site/src/app.css

# Or component-specific styles
vim site/src/routes/+page.svelte  # <style> section
```

### Test with Different Steam IDs

Edit `.env` to switch between Steam IDs for testing:

```env
# Test with friend's profile
STEAM_ID=76561197960287930
```

Run sync script again!

## Need Help?

- Check logs from sync script for errors
- Verify `.env` file is loaded: `echo $STEAM_API_KEY`
- Test API directly: `curl "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=YOUR_KEY&steamids=YOUR_ID"`
- Check SvelteKit docs: https://kit.svelte.dev/

Happy local development! 🚀
