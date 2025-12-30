# 🚀 Local Testing - Quick Start

Test your Steam Profile site locally in **3 steps** (no GitHub required!)

## Step 1: Setup (2 minutes)

```bash
# Clone/enter project directory
cd project_2912

# Install dependencies
npm install
cd site && npm install && cd ..

# Create environment file
cp .env.example .env
```

**Edit `.env`** and add your credentials:
```env
STEAM_API_KEY=ABC123DEF456...
STEAM_ID=76561197960287930
```

## Step 2: Fetch Data (1-5 minutes)

```bash
# Run local sync
npm run sync
```

Choose:
- **Yes** = Full sync with achievements (5-30 min, complete data)
- **No** = Quick sync without achievements (1-2 min, faster testing)

## Step 3: Start Dev Server (instant)

```bash
npm run dev
```

Open **http://localhost:5173** 🎉

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | First-time setup |
| `npm run sync` | Full data sync (interactive) |
| `npm run sync:quick` | Fast sync (no achievements) |
| `npm run dev` | Start dev server |
| `npm run build` | Build production site |
| `npm run preview` | Preview production build |
| `npm run validate` | Validate configuration |
| `npm run reset` | Reset sync state |

---

## Testing URLs

### Pages
- http://localhost:5173 - Profile
- http://localhost:5173/games/1/ - Game library
- http://localhost:5173/game/440/ - Individual game
- http://localhost:5173/stats/ - Statistics

### Themes
- http://localhost:5173/?theme=dark
- http://localhost:5173/?theme=light

### Iframe Parameters
- http://localhost:5173/?compact=true
- http://localhost:5173/?hideHeader=true
- http://localhost:5173/games/1/?sort=name&filter=half

---

## Troubleshooting

**❌ "Setup Required" message?**
→ Run `npm run sync` first

**❌ Port 5173 busy?**
→ `npm run dev -- --port 3000`

**❌ Images not loading?**
→ Run `export $(cat .env | xargs) && node scripts/download-covers.js`

**❌ API errors?**
→ Check Steam profile is public & API key is valid

---

## Update Data

Already synced? Update with:

```bash
npm run sync:quick    # Fast update (profile + recent games)
npm run sync          # Full update (includes achievements)
```

Dev server auto-reloads! 🔥

---

## Deploy to GitHub Pages

Once local testing works:

1. Push code to GitHub
2. Add `STEAM_API_KEY` to repo secrets
3. Enable GitHub Pages (gh-pages branch)
4. Run "Initial Steam Data Sync" workflow
5. Site goes live!

See [QUICKSTART.md](QUICKSTART.md) for full deployment guide.

---

**Need more details?** → [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
