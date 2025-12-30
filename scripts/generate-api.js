#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateAPI() {
  console.log('🔧 Generating API endpoints...');
  
  // Write to site/static/api/
  const apiDir = path.join(process.cwd(), 'site', 'static', 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // Load latest profile
  const profileFile = path.join(process.cwd(), 'site', 'static', 'history', 'profile', 'latest.json');
  let profile = null;
  if (fs.existsSync(profileFile)) {
    profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
  }
  
  // Load latest games
  const gamesFile = path.join(process.cwd(), 'site', 'static', 'history', 'games', 'latest.json');
  let games = null;
  if (fs.existsSync(gamesFile)) {
    games = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
  }
  
  // Load achievements summary
  const achievementsSummaryFile = path.join(process.cwd(), 'site', 'static', 'history', 'achievements', 'summary.json');
  let achievementsSummary = null;
  if (fs.existsSync(achievementsSummaryFile)) {
    achievementsSummary = JSON.parse(fs.readFileSync(achievementsSummaryFile, 'utf8'));
  }
  
  // Generate profile.json
  if (profile) {
    fs.writeFileSync(
      path.join(apiDir, 'profile.json'),
      JSON.stringify(profile, null, 2)
    );
    console.log('   ✅ site/static/api/profile.json');
  }
  
  // Generate games.json
  if (games) {
    fs.writeFileSync(
      path.join(apiDir, 'games.json'),
      JSON.stringify(games, null, 2)
    );
    console.log('   ✅ site/static/api/games.json');
  }
  
  // Generate summary.json
  const summary = {
    profile: profile ? {
      steamid: profile.steamid,
      personaname: profile.personaname,
      avatarfull: profile.avatarfull,
      profileurl: profile.profileurl
    } : null,
    stats: {
      totalGames: games ? games.game_count : 0,
      totalPlaytime: games ? Math.round(games.games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0) / 60) : 0,
      gamesWithAchievements: achievementsSummary ? achievementsSummary.gamesWithAchievements : 0
    },
    lastUpdate: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(apiDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('   ✅ site/static/api/summary.json');
  
  console.log('✅ API endpoints generated');
}

generateAPI();
