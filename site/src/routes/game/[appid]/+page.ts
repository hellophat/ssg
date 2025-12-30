import type { EntryGenerator } from './$types';
import fs from 'fs';
import path from 'path';

export const entries: EntryGenerator = () => {
  try {
    // Try multiple possible paths for the games data
    const possiblePaths = [
      path.join(process.cwd(), '..', 'api', 'games.json'),
      path.join(process.cwd(), 'static', 'api', 'games.json'),
      path.join(process.cwd(), '..', '..', 'api', 'games.json'),
    ];
    
    let gamesData = null;
    for (const gamesPath of possiblePaths) {
      if (fs.existsSync(gamesPath)) {
        console.log(`Loading games from: ${gamesPath}`);
        gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
        break;
      }
    }
    
    if (!gamesData) {
      console.warn('No games data found for prerendering game pages');
      return [];
    }
    
    const games = gamesData.games || [];
    console.log(`Found ${games.length} games for prerendering`);
    
    // Generate entries for each game
    return games.map((game: any) => ({ appid: String(game.appid) }));
  } catch (error) {
    console.error('Error generating game entries:', error);
    return [];
  }
};

// Make prerender optional - only prerender if we have data
export const prerender = true;
export const trailingSlash = 'always';
