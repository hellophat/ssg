# Steam Profile Static Site Generator - Architecture Overview

## Project Summary

A serverless Steam profile tracker that uses GitHub Actions to automatically fetch data from Steam Web API and generate a static website showcasing your gaming profile, library, achievements, and statistics. Inspired by Upptime's architecture.

## Key Features

✅ **Fully Automated** - GitHub Actions handles all data fetching and site building  
✅ **Zero Cost** - Free hosting on GitHub Pages, unlimited Actions minutes for public repos  
✅ **Git as Database** - Full historical data preserved in repository  
✅ **Iframe Embeddable** - Customizable via URL parameters (theme, compact, hideHeader, etc.)  
✅ **Static & Fast** - Pure HTML/CSS/JS, no backend required  
✅ **Resilient Sync** - Batched processing with automatic resume on failure  
✅ **Beautiful UI** - Dark/light themes, responsive design, smooth animations  
✅ **Privacy First** - Self-hosted, you control all your data  

## Architecture Components

### 1. GitHub Actions Workflows

#### Initial Sync (`init-sync.yml`)
- **Trigger**: Manual dispatch
- **Purpose**: Full data collection on first run
- **Process**:
  1. Fetch Steam profile data
  2. Fetch complete owned games list
  3. Batch fetch achievements (10 games per batch with progress logging)
  4. Download game cover images from Steam CDN
  5. Generate API endpoints
  6. Commit all data with resume capability via `.sync-state.json`
- **Duration**: 10-30 minutes for typical libraries (100-500 games)
- **Resume**: Automatically resumes from last completed batch if interrupted

#### Incremental Updates (`steam-data.yml`)
- **Trigger**: Scheduled every 30 minutes
- **Purpose**: Keep data fresh without re-fetching everything
- **Process**:
  1. Update profile data
  2. Fetch recently played games
  3. Check for newly acquired games
  4. Update achievements for active games
  5. Regenerate API endpoints
  6. Commit changes if any
- **Duration**: 1-3 minutes typically
- **Smart**: Only fetches what changed

#### Site Build & Deploy (`build-site.yml`)
- **Trigger**: On data changes (push to history/ or api/)
- **Purpose**: Rebuild and deploy static site
- **Process**:
  1. Build SvelteKit static site
  2. Pre-generate all pagination routes
  3. Configure iframe-friendly headers
  4. Deploy to `gh-pages` branch
- **Duration**: 2-5 minutes
- **Output**: Pure static HTML/CSS/JS

### 2. Data Storage Structure

```
history/
├── profile/
│   ├── YYYY-MM-DD.json     # Daily profile snapshots
│   └── latest.json         # Most recent profile
├── games/
│   ├── YYYY-MM-DD.json     # Daily games list
│   └── latest.json         # Current games list
├── achievements/
│   ├── 440.json            # Per-game achievements (Team Fortress 2)
│   ├── 730.json            # Counter-Strike 2
│   └── summary.json        # Achievement stats
└── stats/
    ├── recent-YYYY-MM-DD.json  # Recent games by date
    └── recent-latest.json       # Latest recent games

api/
├── profile.json            # Latest profile (for site)
├── games.json              # Latest games list
└── summary.json            # Aggregate statistics

site/public/covers/
├── 440.jpg                 # Game cover images
├── 730.jpg
└── ... (one per game)
```

### 3. Static Site (SvelteKit)

#### Pages & Routes

**Home (`/`)**
- Profile overview with avatar and stats
- Recently played games (top 6)
- Quick stats cards (total games, playtime, achievements)

**Games Library (`/games/[page]/`)**
- Paginated game grid (30 games per page)
- Search/filter functionality
- Sortable by playtime, name, or recently played
- Statically pre-generated routes for all pages

**Game Detail (`/game/[appid]/`)**
- Large cover image
- Playtime and last played date
- Full achievement list with progress bar
- Unlocked vs locked achievements
- Pre-generated for every game in library

**Statistics (`/stats/`)**
- Chart.js visualizations
- Top 10 most played games (bar chart)
- Achievement distribution (doughnut chart)
- Top 5 games by playtime (pie chart)
- Aggregate insights and metrics

#### URL Parameters for Iframe Embedding

- `?theme=dark|light` - Color theme
- `?compact=true` - Remove footer
- `?hideHeader=true` - Remove header/navigation
- `?page=N` - Start on specific page
- `?sort=playtime|name|recent` - Sort games
- `?filter=query` - Search games

**Example**: `?theme=dark&compact=true&hideHeader=true`

### 4. Data Fetching Scripts (Node.js)

All scripts in `scripts/` directory:

- **fetch-profile.js** - Get player summary from Steam API
- **fetch-games.js** - Get owned games with playtime
- **fetch-achievements-batch.js** - Batch fetch achievements with resume
- **download-covers.js** - Download game cover images from Steam CDN
- **fetch-recent-games.js** - Get recently played games
- **check-new-games.js** - Detect newly acquired games
- **update-achievements.js** - Update achievements for active games
- **generate-api.js** - Create JSON endpoints for site

## Technical Stack

### Backend (GitHub Actions)
- **Runtime**: Node.js 20
- **Libraries**: axios (HTTP), js-yaml (config parsing)
- **Schedule**: Cron-based (every 30 minutes)
- **Secrets**: Steam API key stored in GitHub Secrets

### Frontend (Static Site)
- **Framework**: SvelteKit 2.x with adapter-static
- **Language**: TypeScript
- **Charts**: Chart.js 4.x
- **Styling**: Custom CSS with CSS variables for theming
- **Build**: Vite (via SvelteKit)

### Hosting
- **Static Files**: GitHub Pages
- **CDN**: GitHub's global CDN
- **SSL**: Automatic HTTPS
- **Custom Domain**: Supported (optional)

## Data Flow

```
┌─────────────────┐
│  Steam Web API  │
└────────┬────────┘
         │
         │ (GitHub Actions fetch data every 30 min)
         ▼
┌─────────────────┐
│ history/ + api/ │ ◄── Git commits (data as code)
└────────┬────────┘
         │
         │ (Trigger on data change)
         ▼
┌─────────────────┐
│  SvelteKit      │
│  Static Build   │
└────────┬────────┘
         │
         │ (Deploy)
         ▼
┌─────────────────┐
│  GitHub Pages   │ ◄── Users access site
└─────────────────┘
```

## Key Design Decisions

### Why Git as Database?
- ✅ Free unlimited storage
- ✅ Full history and auditability
- ✅ Easy rollback and recovery
- ✅ No database setup needed
- ✅ Portable - just clone the repo

### Why Static Site Generation?
- ✅ Instant page loads
- ✅ No server required
- ✅ Free hosting
- ✅ Works offline (after first load)
- ✅ SEO friendly
- ✅ Secure (no backend to hack)

### Why Batched Achievement Fetching?
- ✅ Respects Steam API rate limits
- ✅ Can resume on failure
- ✅ Progress visibility
- ✅ Prevents timeout on large libraries
- ✅ Commits progress incrementally

### Why Separate Workflows?
- ✅ Initial sync runs once (manual)
- ✅ Incremental updates run frequently (automatic)
- ✅ Site only rebuilds when data changes
- ✅ Efficient use of Actions minutes
- ✅ Better monitoring and debugging

## Performance Characteristics

### Initial Sync
- **Small Library** (< 100 games): 5-10 minutes
- **Medium Library** (100-300 games): 10-20 minutes
- **Large Library** (300-500 games): 20-30 minutes
- **Huge Library** (> 500 games): May need multiple runs (auto-resume)

### Incremental Updates
- **Typical**: 1-3 minutes
- **Frequency**: Every 30 minutes
- **Cost**: ~0 (unlimited for public repos)

### Site Build
- **Small** (< 100 games): 2 minutes
- **Medium** (100-300 games): 3-4 minutes
- **Large** (> 300 games): 5-7 minutes

### Site Load Time
- **First Load**: < 2 seconds
- **Subsequent**: < 500ms (cached)
- **Image Loading**: Lazy loaded

## Scalability

### Repository Size
- **Scripts**: ~50 KB
- **Site**: ~200 KB
- **Config**: ~5 KB
- **Data per game**: ~2-5 KB (JSON) + 100-200 KB (cover image)
- **1000 games**: ~100-200 MB total

### GitHub Limits
- **Repository**: 1 GB recommended (5 GB hard limit)
- **Single File**: 100 MB (covers are typically 100-200 KB)
- **Actions Minutes**: Unlimited for public repos
- **Pages**: 1 GB size limit, 100 GB bandwidth/month

## Security Considerations

### API Key Protection
- ✅ Stored in GitHub Secrets (encrypted)
- ✅ Never committed to repository
- ✅ Only accessible to workflows
- ✅ Can be rotated anytime

### Privacy
- ⚠️ Steam profile must be public
- ⚠️ All data is committed to public repo
- ✅ Can use private repo (100 Actions minutes/month)
- ✅ Self-hosted, you control everything

### Iframe Security
- ✅ CORS enabled for embedding
- ✅ CSP headers configured
- ⚠️ Allows embedding from any origin by default
- 🔧 Can be restricted in workflow config

## Maintenance

### Regular Updates
- **Data**: Automatic via scheduled workflows
- **Site**: Automatic on data changes
- **Dependencies**: Manual (npm update)

### Monitoring
- **Workflow Runs**: Check Actions tab for failures
- **Data Quality**: Review commits in history/
- **Site Status**: Check GitHub Pages deployment

### Troubleshooting
- **Failed Sync**: Check workflow logs, validate API key
- **Missing Data**: Verify profile is public
- **Site Not Updating**: Check build workflow status
- **Images Missing**: Some games don't have covers on CDN

## Future Enhancements (Optional)

- [ ] Friend comparison page
- [ ] Game recommendations based on playtime
- [ ] Steam level and badges display
- [ ] Historical playtime trends graph
- [ ] Achievements leaderboard across all games
- [ ] Wishlist integration
- [ ] Trading cards tracking
- [ ] Community integration (comments, reviews)
- [ ] PWA with offline support
- [ ] RSS feed for new achievements

## Comparison with Upptime

| Feature | Upptime | Steam Profile Tracker |
|---------|---------|---------------------|
| Purpose | Website uptime monitoring | Steam profile showcase |
| Data Source | HTTP endpoints | Steam Web API |
| Update Frequency | 5 minutes | 30 minutes |
| Data Type | Response times, status | Games, achievements, playtime |
| Storage | Git commits | Git commits |
| Frontend | Svelte/Sapper | SvelteKit |
| Issue Tracking | GitHub Issues | N/A |
| Notifications | Yes (Issues) | No |
| Charts | Graphs CI | Chart.js |

Both use the same core principle: **GitHub as a free, serverless backend**.

## License

MIT License - Free to use, modify, and distribute.

---

**Created**: December 2025  
**Inspired by**: [Upptime](https://github.com/upptime/upptime)  
**Built with**: SvelteKit, Chart.js, GitHub Actions, Steam Web API
