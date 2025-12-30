#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;
const API_DELAY = parseInt(process.env.API_DELAY || '500');

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
    return [];
  }
}

async function fetchGlobalAchievementPercentages(appId) {
  try {
    const response = await axios.get('https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/', {
      params: {
        key: STEAM_API_KEY,
        gameid: appId
      }
    });
    
    if (response.data.achievementpercentages && response.data.achievementpercentages.achievements) {
      return response.data.achievementpercentages.achievements;
    }
    
    return [];
  } catch (error) {
    // Global percentages unavailable
    return [];
  }
}

async function updateAchievements() {
  console.log('🏆 Updating achievements for active games...');
  
  // Load recent games
  const recentFile = path.join(process.cwd(), 'site', 'static', 'history', 'stats', 'recent-latest.json');
  if (!fs.existsSync(recentFile)) {
    console.log('   No recent games data found');
    return;
  }
  
  const recentData = JSON.parse(fs.readFileSync(recentFile, 'utf8'));
  const recentGames = recentData.games || [];
  
  if (recentGames.length === 0) {
    console.log('   No recently played games');
    return;
  }
  
  const achievementsDir = path.join(process.cwd(), 'site', 'static', 'history', 'achievements');
  let updatedCount = 0;
  
  console.log(`   Processing ${recentGames.length} recently played game(s)...\n`);
  
  for (const game of recentGames) {
    try {
      await sleep(API_DELAY);
      
      console.log(`   Checking ${game.name}...`);
      
      // Fetch player achievements
      const response = await axios.get('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/', {
        params: {
          key: STEAM_API_KEY,
          steamid: STEAM_ID,
          appid: game.appid
        }
      });
      
      if (response.data.playerstats && response.data.playerstats.success) {
        const playerAchievements = response.data.playerstats.achievements || [];
        
        // Fetch achievement schema for icons and descriptions
        await sleep(API_DELAY);
        const schemaAchievements = await fetchGameSchema(game.appid);
        
        // Fetch global achievement percentages
        await sleep(API_DELAY);
        const globalPercentages = await fetchGlobalAchievementPercentages(game.appid);
        
        // Merge player progress with schema data and global percentages
        const mergedAchievements = playerAchievements.map(playerAch => {
          const schemaAch = schemaAchievements.find(s => s.name === playerAch.apiname);
          const globalAch = globalPercentages.find(g => g.name === playerAch.apiname);
          
          // Only add schema fields if schema data was found
          if (schemaAch) {
            return {
              ...playerAch,
              displayName: schemaAch.displayName,
              description: schemaAch.description || '',
              icon: playerAch.achieved ? schemaAch.icon : schemaAch.icongray,
              hidden: schemaAch.hidden || 0,
              globalPercent: globalAch ? parseFloat(globalAch.percent) : null
            };
          }
          
          // Return just the player achievement data if no schema found
          return {
            ...playerAch,
            globalPercent: globalAch ? parseFloat(globalAch.percent) : null
          };
        });
        
        const achievements = {
          appId: game.appid,
          gameName: game.name,
          achievements: mergedAchievements,
          success: true,
          fetchedAt: new Date().toISOString()
        };
        
        const filename = path.join(achievementsDir, `${game.appid}.json`);
        fs.writeFileSync(filename, JSON.stringify(achievements, null, 2));
        updatedCount++;
        console.log(`      ✅ Updated with ${mergedAchievements.length} achievements`);
      } else {
        console.log(`      ⊘ No achievements available`);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`      ⊘ No achievements (game doesn't support achievements)`);
      } else {
        console.warn(`      ⚠️  Failed: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Updated achievements for ${updatedCount} game(s)`);
}

updateAchievements();
