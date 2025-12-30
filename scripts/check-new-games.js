#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

async function checkNewGames() {
  console.log('🔍 Checking for new games...');
  
  try {
    // Fetch current games list
    const response = await axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
      params: {
        key: STEAM_API_KEY,
        steamid: STEAM_ID,
        format: 'json',
        include_appinfo: true,
        include_played_free_games: true
      }
    });
    
    const currentGames = response.data.response.games || [];
    
    // Load previous games list
    const gamesFile = path.join(process.cwd(), 'history', 'games', 'latest.json');
    if (!fs.existsSync(gamesFile)) {
      console.log('   No previous games data found');
      return;
    }
    
    const previousData = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
    const previousGames = previousData.games || [];
    
    // Find new games
    const previousAppIds = new Set(previousGames.map(g => g.appid));
    const newGames = currentGames.filter(g => !previousAppIds.has(g.appid));
    
    if (newGames.length > 0) {
      console.log(`✅ Found ${newGames.length} new game(s):`);
      newGames.forEach(game => {
        console.log(`   + ${game.name}`);
      });
      
      // Update games list
      const timestamp = new Date().toISOString();
      const gamesWithTimestamp = {
        game_count: currentGames.length,
        games: currentGames,
        fetchedAt: timestamp
      };
      
      const historyDir = path.join(process.cwd(), 'history', 'games');
      const filename = path.join(historyDir, `${timestamp.split('T')[0]}.json`);
      fs.writeFileSync(filename, JSON.stringify(gamesWithTimestamp, null, 2));
      
      const latestFile = path.join(historyDir, 'latest.json');
      fs.writeFileSync(latestFile, JSON.stringify(gamesWithTimestamp, null, 2));
      
      // Download covers for new games
      const coversDir = path.join(process.cwd(), 'site', 'public', 'covers');
      for (const game of newGames) {
        try {
          const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
          const coverPath = path.join(coversDir, `${game.appid}.jpg`);
          fs.writeFileSync(coverPath, response.data);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Try fallback
          try {
            const fallbackUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
            const response = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });
            const coverPath = path.join(coversDir, `${game.appid}.jpg`);
            fs.writeFileSync(coverPath, response.data);
          } catch (e) {
            console.warn(`   ⚠️  Failed to download cover for ${game.name}`);
          }
        }
      }
    } else {
      console.log('   No new games found');
    }
  } catch (error) {
    console.error('❌ Error checking new games:', error.message);
    process.exit(1);
  }
}

checkNewGames();
