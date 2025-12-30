#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

if (!STEAM_API_KEY || !STEAM_ID) {
  console.error('❌ Missing required environment variables: STEAM_API_KEY or STEAM_ID');
  process.exit(1);
}

async function fetchGames() {
  console.log('📥 Fetching owned games list...');
  
  try {
    const response = await axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
      params: {
        key: STEAM_API_KEY,
        steamid: STEAM_ID,
        format: 'json',
        include_appinfo: true,
        include_played_free_games: true
      }
    });
    
    const gamesData = response.data.response;
    const timestamp = new Date().toISOString();
    
    if (!gamesData.games) {
      console.error('❌ No games data returned. Profile might be private.');
      process.exit(1);
    }
    
    // Create history directory
    const historyDir = path.join(process.cwd(), 'site', 'static', 'history', 'games');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // Save games with timestamp
    const gamesWithTimestamp = {
      game_count: gamesData.game_count,
      games: gamesData.games,
      fetchedAt: timestamp
    };
    
    const filename = path.join(historyDir, `${timestamp.split('T')[0]}.json`);
    fs.writeFileSync(filename, JSON.stringify(gamesWithTimestamp, null, 2));
    
    // Update latest games
    const latestFile = path.join(historyDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(gamesWithTimestamp, null, 2));
    
    console.log(`✅ Games data saved: ${gamesData.game_count} games found`);
    console.log(`   Total playtime: ${Math.round(gamesData.games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0) / 60)} hours`);
    
    return gamesWithTimestamp;
  } catch (error) {
    console.error('❌ Error fetching games:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    process.exit(1);
  }
}

fetchGames();
