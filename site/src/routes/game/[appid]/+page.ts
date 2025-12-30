import type { EntryGenerator } from './$types';
import fs from 'fs';
import path from 'path';

export const entries: EntryGenerator = () => {
  try {
    // Load games data to get all app IDs
    const gamesPath = path.join(process.cwd(), '..', 'history', 'games', 'latest.json');
    if (!fs.existsSync(gamesPath)) {
      return [];
    }
    
    const gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    const games = gamesData.games || [];
    
    // Generate entries for each game
    return games.map((game: any) => ({ appid: String(game.appid) }));
  } catch (error) {
    console.error('Error generating game entries:', error);
    return [];
  }
};

export const prerender = true;
export const trailingSlash = 'always';
