#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;
const API_DELAY = parseInt(process.env.API_DELAY || '500');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchRecentGames() {
  console.log('📥 Fetching recently played games...');
  
  try {
    const response = await axios.get('http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/', {
      params: {
        key: STEAM_API_KEY,
        steamid: STEAM_ID,
        format: 'json'
      }
    });
    
    const timestamp = new Date().toISOString();
    const recentGames = response.data.response;
    
    // Create stats directory
    const statsDir = path.join(process.cwd(), 'history', 'stats');
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }
    
    // Save recent games with timestamp
    const recentData = {
      ...recentGames,
      fetchedAt: timestamp
    };
    
    const filename = path.join(statsDir, `recent-${timestamp.split('T')[0]}.json`);
    fs.writeFileSync(filename, JSON.stringify(recentData, null, 2));
    
    // Update latest recent games
    const latestFile = path.join(statsDir, 'recent-latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(recentData, null, 2));
    
    console.log(`✅ Recent games saved: ${recentGames.total_count || 0} games`);
    
    return recentData;
  } catch (error) {
    console.error('❌ Error fetching recent games:', error.message);
    process.exit(1);
  }
}

fetchRecentGames();
