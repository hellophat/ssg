# Quick Start Guide

Get your Steam Profile site up and running in 10 minutes!

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Steam account with **public profile**
- [ ] Steam Web API Key ([Get it here](https://steamcommunity.com/dev/apikey))
- [ ] Your 64-bit Steam ID ([Find it here](https://steamid.io/))

## Step-by-Step Setup

### 1. Fork/Clone Repository (1 minute)

**Option A: Fork on GitHub**
1. Click "Fork" button at the top of this page
2. Wait for GitHub to create your copy

**Option B: Clone Locally**
```bash
git clone https://github.com/YOUR_USERNAME/steam-profile-tracker.git
cd steam-profile-tracker
```

### 2. Configure Steam Details (2 minutes)

Edit `.steamrc.yml`:
```yaml
steamId: "76561197960287930"  # Replace with YOUR Steam ID
```

**Find Your Steam ID:**
1. Go to https://steamid.io/
2. Enter your Steam profile URL
3. Copy the **steamID64** value

### 3. Add Steam API Key to GitHub Secrets (2 minutes)

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `STEAM_API_KEY`
5. Value: Your Steam API key from https://steamcommunity.com/dev/apikey
6. Click **Add secret**

### 4. Enable GitHub Pages (1 minute)

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **root**
3. Click **Save**

### 5. Run Initial Data Sync (3 minutes setup + wait time)

1. Go to **Actions** tab
2. Click on **Initial Steam Data Sync** workflow (left sidebar)
3. Click **Run workflow** button (right side)
4. Click the green **Run workflow** button in the dropdown
5. Wait for completion (10-30 minutes depending on your library size)

**Progress Monitoring:**
- Click on the running workflow to see live logs
- You'll see batch progress: "Batch 1/25: Processing games 1-10 of 250"
- Green checkmark = success!

### 6. Verify Site Deployment (1 minute)

After initial sync completes:
1. Go to **Actions** tab
2. Check that **Build and Deploy Site** workflow ran successfully
3. Go to **Settings** → **Pages**
4. Your site URL will be shown: `https://YOUR_USERNAME.github.io/steam-profile-tracker/`
5. Click the link to view your site!

## Troubleshooting Common Issues

### ❌ "No player data returned"
**Problem**: Steam API can't find your profile  
**Solution**: 
- Double-check your Steam ID in `.steamrc.yml`
- Ensure your Steam profile is **public** (not private/friends only)

### ❌ "Missing required environment variables"
**Problem**: Steam API key not set  
**Solution**:
- Verify you added `STEAM_API_KEY` to GitHub Secrets
- Check the secret name is exactly `STEAM_API_KEY` (case-sensitive)

### ❌ "Initial sync not completed"
**Problem**: Trying to view site before data is synced  
**Solution**:
- Wait for initial sync workflow to complete
- Check workflow status in Actions tab
- If failed, check error logs and re-run

### ❌ "Page not found" on site URL
**Problem**: GitHub Pages not enabled or not built yet  
**Solution**:
- Ensure GitHub Pages is enabled (Settings → Pages)
- Wait for build workflow to complete
- Check that `gh-pages` branch exists

### ❌ Images not loading
**Problem**: Steam CDN issues or missing covers  
**Solution**:
- Some games don't have library images on Steam CDN
- Images load lazily - scroll down to see them
- Missing images are automatically hidden

## Next Steps

### Customize Your Site

Edit `.steamrc.yml` to customize:
```yaml
site:
  name: "Your Name's Steam Profile"
  theme: "dark"  # or "light"
  pagination:
    gamesPerPage: 30  # Adjust page size
  defaultSort: "playtime"  # or "name" or "recent"
```

### Change Update Frequency

Edit `.github/workflows/steam-data.yml`:
```yaml
schedule:
  - cron: '*/30 * * * *'  # Every 30 minutes
  # - cron: '0 * * * *'   # Every hour
  # - cron: '0 */6 * * *' # Every 6 hours
```

### Embed in Your Website

```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/"
  width="800"
  height="600"
  frameborder="0"
></iframe>
```

See [IFRAME_EXAMPLES.md](IFRAME_EXAMPLES.md) for more options.

### Use Custom Domain

1. Add a file named `CNAME` to `site/static/` with your domain:
   ```
   steam.yourdomain.com
   ```
2. Configure DNS:
   - Type: `CNAME`
   - Name: `steam`
   - Value: `YOUR_USERNAME.github.io`
3. Enable "Enforce HTTPS" in GitHub Pages settings

## Validation

Run the validation script to check everything is configured correctly:

```bash
npm install
npm run validate
```

## Getting Help

- 📖 Read the [full README](README.md)
- 🏗️ Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- 🐛 [Open an issue](https://github.com/YOUR_USERNAME/steam-profile-tracker/issues) if you need help
- 💬 Check existing issues for solutions

## Quick Reference

| Task | Command/Location |
|------|-----------------|
| Validate config | `npm run validate` |
| Reset sync | `npm run reset` |
| Run site locally | `npm run dev` |
| Build site | `npm run build` |
| View workflows | GitHub → Actions tab |
| View secrets | Settings → Secrets and variables |
| Enable Pages | Settings → Pages |
| Site URL | Settings → Pages → Your site is live at... |

## Timeline

Expected timeline for first-time setup:

```
┌─────────────────────────────────────────────────────────────┐
│ 0 min: Start                                                │
│ 2 min: Repository cloned/forked                            │
│ 4 min: Configuration updated                               │
│ 6 min: Secrets added & Pages enabled                       │
│ 8 min: Initial sync workflow started                       │
│ 10-40 min: Waiting for sync to complete                   │
│ 42 min: Build workflow automatically triggered            │
│ 45 min: Site live! 🎉                                      │
└─────────────────────────────────────────────────────────────┘
```

*Time varies based on number of games in your library*

## Success Indicators

✅ Initial sync workflow completed successfully  
✅ `history/` directory populated with JSON files  
✅ `site/public/covers/` contains game images  
✅ Build workflow completed successfully  
✅ `gh-pages` branch exists  
✅ Site URL loads without errors  
✅ Profile data displays correctly  

## What's Next?

Once your site is live:
- Share your site URL with friends
- Embed it on your blog or portfolio
- Customize the theme and layout
- Add more games to your Steam library (they'll auto-update!)
- Check back every 30 minutes for updated stats

**Enjoy your automated Steam profile! 🎮**

---

Need more help? Check the [README](README.md) or open an issue!
