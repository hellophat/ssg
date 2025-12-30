#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10');
const BATCH_DELAY = parseInt(process.env.BATCH_DELAY || '2000');
const API_DELAY = parseInt(process.env.API_DELAY || '500');
const RESUME = process.env.RESUME === 'true';
const LAST_BATCH = parseInt(process.env.LAST_BATCH || '0');

if (!STEAM_API_KEY || !STEAM_ID) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchGameSchema(appId) {
  try {
    const response = await axios.get('https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/', {
      params: {
        key: STEAM_API_KEY,
        appid: appId
      }
    });
    
    if (response.data.game && response.data.game.availableGameStats) {
      return response.data.game.availableGameStats.achievements || [];
    }
    
    return [];
  } catch (error) {
    // Schema fetch failed - this is normal for some games
    if (error.response && error.response.status === 403) {
      console.log(`      ℹ️  Schema unavailable (game may not have public achievement data)`);
    }
    return [];
  }
}

async function fetchAchievementsForGame(appId, gameName) {
  try {
    await sleep(API_DELAY);
    
    // Fetch player achievements
    const response = await axios.get('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/', {
      params: {
        key: STEAM_API_KEY,
        steamid: STEAM_ID,
        appid: appId
      }
    });
    
    if (response.data.playerstats && response.data.playerstats.success) {
      const playerAchievements = response.data.playerstats.achievements || [];
      
      // Fetch achievement schema for icons and descriptions
      await sleep(API_DELAY);
      const schemaAchievements = await fetchGameSchema(appId);
      
      // Merge player progress with schema data
      const mergedAchievements = playerAchievements.map(playerAch => {
        const schemaAch = schemaAchievements.find(s => s.name === playerAch.apiname);
        
        // Only add schema fields if schema data was found
        if (schemaAch) {
          return {
            ...playerAch,
            displayName: schemaAch.displayName,
            description: schemaAch.description || '',
            icon: playerAch.achieved ? schemaAch.icon : schemaAch.icongray,
            hidden: schemaAch.hidden || 0
          };
        }
        
        // Return just the player achievement data if no schema found
        return playerAch;
      });
      
      return {
        appId,
        gameName,
        achievements: mergedAchievements,
        success: true,
        fetchedAt: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    // Game might not have achievements or profile is private
    if (error.response && error.response.status === 400) {
      return null;
    }
    console.warn(`   ⚠️  Failed to fetch achievements for ${gameName}: ${error.message}`);
    return null;
  }
}

async function fetchAchievementsBatch() {
  console.log('📥 Fetching achievements in batches...');
  
  // Load games list
  const gamesFile = path.join(process.cwd(), 'site', 'static', 'history', 'games', 'latest.json');
  if (!fs.existsSync(gamesFile)) {
    console.error('❌ Games list not found. Run fetch-games.js first.');
    process.exit(1);
  }
  
  const gamesData = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
  const games = gamesData.games;
  
  // Create achievements directory
  const achievementsDir = path.join(process.cwd(), 'site', 'static', 'history', 'achievements');
  if (!fs.existsSync(achievementsDir)) {
    fs.mkdirSync(achievementsDir, { recursive: true });
  }
  
  // Calculate batches
  const totalGames = games.length;
  const totalBatches = Math.ceil(totalGames / BATCH_SIZE);
  let startBatch = RESUME ? LAST_BATCH : 0;
  
  console.log(`📊 Total games: ${totalGames}`);
  console.log(`📦 Batch size: ${BATCH_SIZE}`);
  console.log(`🔢 Total batches: ${totalBatches}`);
  
  if (RESUME && startBatch > 0) {
    console.log(`▶️  Resuming from batch ${startBatch + 1}...`);
  }
  
  let processedCount = startBatch * BATCH_SIZE;
  let successCount = 0;
  
  // Process batches
  for (let batchNum = startBatch; batchNum < totalBatches; batchNum++) {
    const batchStart = batchNum * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalGames);
    const batch = games.slice(batchStart, batchEnd);
    
    console.log(`\n📦 Batch ${batchNum + 1}/${totalBatches}: Processing games ${batchStart + 1}-${batchEnd} of ${totalGames}`);
    
    for (const game of batch) {
      const achievements = await fetchAchievementsForGame(game.appid, game.name);
      
      if (achievements) {
        const filename = path.join(achievementsDir, `${game.appid}.json`);
        fs.writeFileSync(filename, JSON.stringify(achievements, null, 2));
        successCount++;
        console.log(`   ✅ ${game.name} (${achievements.achievements.length} achievements)`);
      } else {
        console.log(`   ⊘  ${game.name} (no achievements)`);
      }
      
      processedCount++;
    }
    
    // Update sync state after each batch
    const syncState = {
      completed: false,
      lastCompletedBatch: batchNum,
      totalBatches: totalBatches,
      processedGames: processedCount,
      totalGames: totalGames,
      lastUpdate: new Date().toISOString()
    };
    
    fs.writeFileSync('.sync-state.json', JSON.stringify(syncState, null, 2));
    
    // Commit batch progress
    console.log(`💾 Batch ${batchNum + 1} completed. Committing progress...`);
    
    // Delay before next batch
    if (batchNum < totalBatches - 1) {
      console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
      await sleep(BATCH_DELAY);
    }
  }
  
  console.log(`\n✅ All batches completed!`);
  console.log(`   Processed: ${processedCount} games`);
  console.log(`   With achievements: ${successCount} games`);
  
  // Create summary
  const summary = {
    totalGames: totalGames,
    gamesWithAchievements: successCount,
    lastSync: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(achievementsDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
}

fetchAchievementsBatch().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
