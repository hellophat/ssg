import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Configure adapter-static for purely static site generation
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: false  // Allow build without all dynamic routes prerendered (for initial build before data sync)
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/project_2912' : ''
		}
	}
};

export default config;
