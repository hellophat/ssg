# Steam Profile Static Site Generator

A serverless Steam profile tracker inspired by [Upptime](https://github.com/upptime/upptime), using GitHub Actions to automatically fetch Steam user data and generate a beautiful static site showcasing your profile, game library, achievements, and playtime statistics. The site is fully embeddable in iframes with customizable parameters.

## 🧪 Test Locally First!

**Want to try it before deploying?** You can test everything locally without GitHub Actions!

```bash
npm install
cp .env.example .env    # Add your Steam credentials
npm run sync            # Fetch data
npm run dev             # Start dev server at http://localhost:5173
```

See [LOCAL_TESTING.md](LOCAL_TESTING.md) for the quick guide or [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for detailed instructions.

## ✨ Features

- 🎮 **Complete Steam Profile** - Display your profile information, avatar, and Steam ID
- 📚 **Game Library** - Paginated, searchable, and sortable game collection
- 🏆 **Achievement Tracking** - Track achievements for all your games
- 📊 **Statistics & Analytics** - Beautiful charts showing playtime trends and gaming habits
- 🔄 **Automated Updates** - GitHub Actions fetch data every 30 minutes (unlimited for public repos)
- 💾 **Git as Database** - Full historical data preserved in git commits
- 🖼️ **Iframe Embeddable** - Embed in your website with customizable parameters
- 🎨 **Dark/Light Themes** - Switch between themes via URL parameters
- 📱 **Fully Responsive** - Works great on mobile, tablet, and desktop
- 🚀 **Zero Cost** - Free hosting on GitHub Pages, free compute with GitHub Actions
- 🔒 **Privacy First** - You control your own data, all self-hosted

## 📋 Prerequisites

- GitHub account
- Steam account with public profile
- Steam Web API Key (get yours at https://steamcommunity.com/dev/apikey)
- Your 64-bit Steam ID (find it at https://steamid.io/)

## 🚀 Quick Start

### 1. Fork or Clone This Repository

```bash
git clone https://github.com/YOUR_USERNAME/steam-profile-tracker.git
cd steam-profile-tracker
```

### 2. Configure Your Steam Details

Edit `.steamrc.yml` and replace the placeholder values:

```yaml
steamId: "YOUR_64_BIT_STEAM_ID"  # e.g., "76561197960287930"
```

### 3. Add Your Steam API Key to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `STEAM_API_KEY`
5. Value: Your Steam API key
6. Click **Add secret**

### 4. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **root**
4. Click **Save**

### 5. Run Initial Data Sync

1. Go to **Actions** tab
2. Select **Initial Steam Data Sync** workflow
3. Click **Run workflow**
4. Wait for the workflow to complete (may take 10-30 minutes for large libraries)

### 6. Wait for Site Build

After initial sync completes, the **Build and Deploy Site** workflow will automatically run and deploy your site to GitHub Pages.

Your site will be available at: `https://YOUR_USERNAME.github.io/steam-profile-tracker/`

## 🔧 Configuration

### Basic Settings

Edit `.steamrc.yml` to customize:

```yaml
# Data collection settings
dataCollection:
  batchSize: 10          # Games per batch during achievement sync
  batchDelay: 2000       # Delay between batches (ms)
  apiDelay: 500          # Delay between API calls (ms)

# Site configuration
site:
  name: "My Steam Profile"
  theme: "dark"          # dark, light, or auto
  pagination:
    gamesPerPage: 30     # Games per page in library
  defaultSort: "playtime"  # playtime, name, or recent
```

### Update Frequency

By default, data updates every 30 minutes. To change this, edit `.github/workflows/steam-data.yml`:

```yaml
schedule:
  - cron: '*/30 * * * *'  # Every 30 minutes
  # - cron: '0 * * * *'   # Every hour
  # - cron: '0 */6 * * *' # Every 6 hours
```

## 🖼️ Iframe Embedding

Embed your Steam profile anywhere using an iframe with customizable parameters:

### Basic Embed

```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/" 
  width="100%" 
  height="600"
  frameborder="0"
></iframe>
```

### Customization Parameters

- `?theme=dark` or `?theme=light` - Set theme
- `?compact=true` - Compact layout (removes footer)
- `?hideHeader=true` - Hide navigation header
- `?page=2` - Start on specific games page
- `?sort=playtime` - Sort games (playtime, name, recent)
- `?filter=counter` - Filter/search games

### Examples

**Compact Dark Profile:**
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/?theme=dark&compact=true" 
  width="800" 
  height="600"
></iframe>
```

**Headless Game Library:**
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/games/1/?hideHeader=true&sort=name" 
  width="100%" 
  height="800"
></iframe>
```

**Light Theme Stats:**
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/stats/?theme=light" 
  width="800" 
  height="1000"
></iframe>
```

## 📁 Project Structure

```
.
├── .github/workflows/
│   ├── init-sync.yml       # Initial full data sync
│   ├── steam-data.yml      # Incremental updates (every 30 min)
│   └── build-site.yml      # Build and deploy static site
├── history/
│   ├── profile/            # Profile data history
│   ├── games/              # Games library history
│   ├── achievements/       # Per-game achievements (appid.json)
│   └── stats/              # Statistics history
├── api/
│   ├── profile.json        # Latest profile snapshot
│   ├── games.json          # Latest games list
│   └── summary.json        # Summary statistics
├── site/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte           # Profile overview
│   │   │   ├── games/[page]/          # Paginated game library
│   │   │   ├── game/[appid]/          # Individual game page
│   │   │   └── stats/                 # Statistics & charts
│   │   └── app.css         # Global styles
│   └── public/
│       └── covers/         # Game cover images
├── scripts/
│   ├── fetch-profile.js               # Fetch Steam profile
│   ├── fetch-games.js                 # Fetch owned games
│   ├── fetch-achievements-batch.js    # Batch fetch achievements
│   ├── download-covers.js             # Download game covers
│   ├── fetch-recent-games.js          # Fetch recently played
│   ├── check-new-games.js             # Check for new games
│   ├── update-achievements.js         # Update active games
│   └── generate-api.js                # Generate API endpoints
├── .steamrc.yml            # Configuration file
└── README.md               # This file
```

## 🛠️ Helper Scripts

### Validate Configuration

```bash
bash scripts/validate-config.sh
```

Checks if your `.steamrc.yml` is properly configured and Steam API key is set.

### Reset Sync State

```bash
bash scripts/reset-sync.sh
```

Clears the sync state to start fresh data collection from scratch.

## 🔍 Troubleshooting

### Initial Sync Fails

- **Check Steam API Key**: Ensure `STEAM_API_KEY` secret is correctly set
- **Check Steam ID**: Verify your 64-bit Steam ID in `.steamrc.yml`
- **Profile Privacy**: Your Steam profile must be **public** for the API to work
- **Rate Limiting**: If you have many games (500+), the workflow may timeout. It will resume automatically on next run.

### No Data Showing on Site

- **Run Initial Sync First**: The site needs data before it can display anything
- **Wait for Build**: After data sync, wait for the build workflow to complete
- **Check GitHub Pages**: Ensure GitHub Pages is enabled and set to deploy from `gh-pages` branch

### Images Not Loading

- **Steam CDN**: Some games may not have cover images on Steam CDN
- **CORS Issues**: If embedding in iframe, ensure your site allows cross-origin images
- **Fallback**: The site will hide missing images automatically

### Workflow Errors

- **API Quota**: Steam may rate limit if too many requests. Scripts include delays to prevent this.
- **Network Issues**: Temporary network errors will be retried on next workflow run
- **Partial Progress**: Initial sync commits progress after each batch, so it can resume if interrupted

## 🎨 Customization

### Styling

Edit `site/src/app.css` to customize colors, fonts, and layout. The app uses CSS custom properties for easy theming:

```css
[data-theme='dark'] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #c9d1d9;
  --accent: #58a6ff;
  /* ... more variables */
}
```

### Adding New Pages

Create new routes in `site/src/routes/`. SvelteKit will automatically generate static pages during build.

### Modifying Data Collection

Edit scripts in `scripts/` directory to change what data is fetched or how it's processed.

## 📊 Architecture

This project follows the **Upptime pattern**:

1. **GitHub Actions as Serverless Backend** - Scheduled workflows fetch data from Steam API
2. **Git as Database** - All historical data committed to repository
3. **Static Site Generation** - SvelteKit builds pure HTML/CSS/JS
4. **GitHub Pages Hosting** - Free, fast CDN for static content

### Why This Approach?

- ✅ Zero infrastructure costs
- ✅ Version control for all data
- ✅ Transparent operation
- ✅ Easy to maintain and customize
- ✅ Portable (just git clone)
- ✅ Privacy-respecting (you own everything)

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Share your customized version

## 📝 License

MIT License - feel free to use this project for any purpose.

## 🙏 Credits

- Inspired by [Upptime](https://github.com/upptime/upptime) - the brilliant uptime monitor using GitHub as a backend
- Built with [SvelteKit](https://kit.svelte.dev/) and [Chart.js](https://www.chartjs.org/)
- Data from [Steam Web API](https://developer.valvesoftware.com/wiki/Steam_Web_API)

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the [Steam Web API documentation](https://developer.valvesoftware.com/wiki/Steam_Web_API)
- Review [GitHub Actions documentation](https://docs.github.com/en/actions)

---

**Happy Gaming! 🎮**
