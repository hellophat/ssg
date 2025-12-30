#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadCovers() {
  console.log('🖼️  Downloading game cover images...');
  
  // Load games list
  const gamesFile = path.join(process.cwd(), 'history', 'games', 'latest.json');
  if (!fs.existsSync(gamesFile)) {
    console.error('❌ Games list not found.');
    process.exit(1);
  }
  
  const gamesData = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
  const games = gamesData.games;
  
  // Create covers directory in static (for SvelteKit)
  const coversDir = path.join(process.cwd(), 'site', 'static', 'covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
  
  let downloadedCount = 0;
  let skippedCount = 0;
  
  for (const game of games) {
    const coverPath = path.join(coversDir, `${game.appid}.jpg`);
    
    // Skip if already exists
    if (fs.existsSync(coverPath)) {
      skippedCount++;
      continue;
    }
    
    try {
      // Steam CDN URL for game capsule image
      const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      fs.writeFileSync(coverPath, response.data);
      downloadedCount++;
      
      if (downloadedCount % 10 === 0) {
        console.log(`   Downloaded ${downloadedCount} covers...`);
      }
      
      // Small delay to be nice to Steam CDN
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Fallback to header image if library image doesn't exist
      try {
        const fallbackUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
        const response = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        fs.writeFileSync(coverPath, response.data);
        downloadedCount++;
      } catch (fallbackError) {
        console.warn(`   ⚠️  Failed to download cover for ${game.name} (${game.appid})`);
      }
    }
  }
  
  console.log(`✅ Cover images downloaded:`);
  console.log(`   New: ${downloadedCount}`);
  console.log(`   Skipped (existing): ${skippedCount}`);
}

downloadCovers().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
