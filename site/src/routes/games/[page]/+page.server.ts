import type { PageServerLoad } from './$types';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export const load: PageServerLoad = async () => {
  // Load configuration
  const configPath = path.join(process.cwd(), '..', '.steamrc.yml');
  const config: any = yaml.load(fs.readFileSync(configPath, 'utf8'));
  const gamesPerPage = config.site.pagination.gamesPerPage || 30;
  
  // Load games data
  const gamesPath = path.join(process.cwd(), '..', 'history', 'games', 'latest.json');
  let totalGames = 0;
  
  if (fs.existsSync(gamesPath)) {
    const gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    totalGames = gamesData.game_count || 0;
  }
  
  const totalPages = Math.ceil(totalGames / gamesPerPage);
  
  return {
    totalPages,
    gamesPerPage
  };
};

export const prerender = true;
export const trailingSlash = 'always';
