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

async function fetchProfile() {
  console.log('📥 Fetching Steam profile data...');
  
  try {
    const response = await axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
      params: {
        key: STEAM_API_KEY,
        steamids: STEAM_ID
      }
    });
    
    const players = response.data.response.players;
    if (!players || players.length === 0) {
      throw new Error('No player data returned');
    }
    
    const profile = players[0];
    const timestamp = new Date().toISOString();
    
    // Create history directory if it doesn't exist
    const historyDir = path.join(process.cwd(), 'history', 'profile');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // Save profile with timestamp
    const profileData = {
      ...profile,
      fetchedAt: timestamp
    };
    
    const filename = path.join(historyDir, `${timestamp.split('T')[0]}.json`);
    fs.writeFileSync(filename, JSON.stringify(profileData, null, 2));
    
    // Update latest profile
    const latestFile = path.join(historyDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(profileData, null, 2));
    
    console.log('✅ Profile data saved:');
    console.log(`   Name: ${profile.personaname}`);
    console.log(`   Steam ID: ${profile.steamid}`);
    console.log(`   Profile URL: ${profile.profileurl}`);
    
    return profileData;
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    process.exit(1);
  }
}

fetchProfile();
