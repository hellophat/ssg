import type { EntryGenerator } from './$types';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export const entries: EntryGenerator = () => {
  try {
    // Load configuration
    const configPath = path.join(process.cwd(), '..', '.steamrc.yml');
    const config: any = yaml.load(fs.readFileSync(configPath, 'utf8'));
    const gamesPerPage = config.site.pagination.gamesPerPage || 30;
    
    // Load games data
    const gamesPath = path.join(process.cwd(), '..', 'history', 'games', 'latest.json');
    if (!fs.existsSync(gamesPath)) {
      return [{ page: '1' }];
    }
    
    const gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    const totalGames = gamesData.game_count || 0;
    const totalPages = Math.ceil(totalGames / gamesPerPage);
    
    // Generate page entries
    return Array.from({ length: totalPages }, (_, i) => ({ page: String(i + 1) }));
  } catch (error) {
    console.error('Error generating page entries:', error);
    return [{ page: '1' }];
  }
};

export type { PageServerLoad as Load } from './+page.server';

export const load = async ({ parent }: any) => {
  return await parent();
};
