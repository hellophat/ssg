<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	let games: any[] = $state([]);
	let gameAchievements: Record<string, any> = $state({});
	let loading = $state(true);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Use default value if data is not loaded
	let gamesPerPage = $derived(data?.gamesPerPage || 30);
	
	let currentPage = $derived(parseInt($page.params.page) || 1);
	
	// URL parameters - set defaults for SSR
	let sortParam = $state('playtime');
	let searchQuery = $state(''); // Local state for real-time search
	let previousSearch = $state(''); // Track previous search to detect changes
	
	// Update URL parameters in browser
	if (browser) {
		$effect(() => {
			sortParam = $page.url.searchParams.get('sort') || 'playtime';
			// Initialize search from URL only on mount
			const urlFilter = $page.url.searchParams.get('filter');
			if (urlFilter && !searchQuery) {
				searchQuery = urlFilter;
				previousSearch = urlFilter;
			}
		});
	}
	
	// Navigate to page 1 when search changes
	$effect(() => {
		if (browser && searchQuery !== previousSearch && currentPage !== 1) {
			previousSearch = searchQuery;
			const url = new URL(window.location.href);
			url.pathname = `${base}/games/1/`;
			goto(url.pathname + url.search, { replaceState: true, keepFocus: true });
		} else if (browser && searchQuery !== previousSearch) {
			previousSearch = searchQuery;
		}
	});
	
	// Use $derived.by for filtered and sorted games
	let filteredGames = $derived.by(() => {
		if (!games || games.length === 0) return [];
		
		let result = [...games];
		
		// Apply search filter
		if (searchQuery) {
			result = result.filter(g => 
				g.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		
		// Apply sorting
		switch (sortParam) {
			case 'playtime':
				result.sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0));
				break;
			case 'name':
				result.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'recent':
				result.sort((a, b) => (b.rtime_last_played || 0) - (a.rtime_last_played || 0));
				break;
		}
		
		return result;
	});
	
	onMount(async () => {
		try {
			const res = await fetch(`${base}/api/games.json`);
			if (res.ok) {
				const resData = await res.json();
				games = resData.games || [];
				console.log('Loaded games:', games.length);
			}
			loading = false;
		} catch (err) {
			console.error('Error loading games:', err);
			loading = false;
		}
	});
	
	// Load achievements for paginated games
	$effect(() => {
		if (paginatedGames.length > 0) {
			for (const game of paginatedGames) {
				const appidStr = game.appid.toString();
				if (gameAchievements[appidStr] === undefined) {
					fetch(`${base}/history/achievements/${game.appid}.json`)
						.then(res => res.ok ? res.json() : null)
						.then(data => {
							// Store data or null to mark as fetched
							gameAchievements[appidStr] = data;
						})
						.catch(() => {
							// Mark as fetched even on error
							gameAchievements[appidStr] = null;
						});
				}
			}
		}
	});
	
	function getAchievementProgress(appid: number) {
		const ach = gameAchievements[appid.toString()];
		if (!ach || !ach.achievements) return null;
		const achieved = ach.achievements.filter((a: any) => a.achieved === 1).length;
		const total = ach.achievements.length;
		return { achieved, total, percentage: total > 0 ? (achieved / total) * 100 : 0 };
	}
	
	let startIdx = $derived((currentPage - 1) * gamesPerPage);
	let endIdx = $derived(startIdx + gamesPerPage);
	let paginatedGames = $derived(filteredGames.slice(startIdx, endIdx));
	let totalPages = $derived(Math.ceil(filteredGames.length / gamesPerPage));
	
	$effect(() => {
		console.log('Games:', games.length);
		console.log('Filtered games:', filteredGames.length);
		console.log('Paginated games:', paginatedGames.length);
		console.log('Games per page:', gamesPerPage);
		console.log('Start/End:', startIdx, endIdx);
	});
	
	function formatPlaytime(minutes: number) {
		const hours = Math.round(minutes / 60);
		if (hours < 1) return `${minutes}m`;
		return `${hours.toLocaleString()}h`;
	}
	
	function formatDate(timestamp: number) {
		if (!timestamp) return 'Never';
		return new Date(timestamp * 1000).toLocaleDateString();
	}
</script>

<div class="games-container">
	<div class="games-header">
		<h1>Game Library</h1>
		<p class="game-count">{filteredGames.length} games</p>
	</div>
	
	<div class="controls card">
		<div class="search">
			<input 
				type="text" 
				placeholder="Search games..." 
				bind:value={searchQuery}
			/>
		</div>
		
		<div class="sort">
			<label for="sort">Sort by:</label>
			<select id="sort" value={sortParam} onchange={(e) => {
				const url = new URL(window.location.href);
				url.searchParams.set('sort', e.currentTarget.value);
				window.location.href = url.toString();
			}}>
				<option value="playtime">Most Played</option>
				<option value="name">Name (A-Z)</option>
				<option value="recent">Recently Played</option>
			</select>
		</div>
	</div>
	
	{#if loading}
		<div class="loading">Loading games...</div>
	{:else if paginatedGames.length === 0}
		<div class="no-results card">
			<p>No games found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
		</div>
	{:else}
		<div class="games-grid">
			{#each paginatedGames as game}
				<a href="{base}/game/{game.appid}/" class="game-item card">
					<div class="game-cover">
						<img 
							src="{base}/covers/{game.appid}.jpg" 
							alt={game.name}
							loading="lazy"
							onerror={(e) => e.currentTarget.style.display = 'none'}
						/>
					</div>
					<div class="game-details">
						<h3>{game.name}</h3>
						<div class="game-meta">
							<span class="playtime">⏱️ {formatPlaytime(game.playtime_forever || 0)}</span>
							{#if game.rtime_last_played}
								<span class="last-played">Last: {formatDate(game.rtime_last_played)}</span>
							{/if}
							{#if getAchievementProgress(game.appid)}
								{@const progress = getAchievementProgress(game.appid)}
								<div class="achievement-progress">
									<div class="progress-bar-mini">
										<div class="progress-fill-mini" style="width: {progress.percentage}%"></div>
									</div>
									<span class="progress-text-mini">🏆 {progress.achieved}/{progress.total}</span>
								</div>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
		
		{#if totalPages > 1}
			<div class="pagination">
				{#if currentPage > 1}
					<a href="{base}/games/{currentPage - 1}/?sort={sortParam}" class="button">
						← Previous
					</a>
				{/if}
				
				<span class="page-info">
					Page {currentPage} of {totalPages}
				</span>
				
				{#if currentPage < totalPages}
					<a href="{base}/games/{currentPage + 1}/?sort={sortParam}" class="button">
						Next →
					</a>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.games-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.games-header {
		text-align: center;
		margin-bottom: 0.5rem;
	}
	
	.games-header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}
	
	.game-count {
		color: var(--text-secondary);
		font-size: 1rem;
	}
	
	.controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 1.25rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.search {
		flex: 1;
		min-width: 200px;
	}
	
	.search input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		border-radius: 12px;
		color: var(--text-primary);
		font-size: 0.95rem;
		transition: all 0.3s;
	}
	
	.search input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
	}
	
	.sort {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.sort label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 600;
	}
	
	.sort select {
		padding: 0.75rem 1rem;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		border-radius: 12px;
		color: var(--text-primary);
		cursor: pointer;
		font-size: 0.95rem;
		transition: all 0.3s;
	}
	
	.sort select:focus {
		outline: none;
		border-color: var(--accent);
	}
	
	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1.25rem;
		animation: fadeIn 0.5s ease-in;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.game-item {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: var(--text-primary);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 0;
		overflow: hidden;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.game-item:hover {
		transform: translateY(-5px) scale(1.02);
		border-color: var(--accent);
		box-shadow: 0 12px 28px rgba(88, 166, 255, 0.25);
	}
	
	.game-cover {
		width: 100%;
		aspect-ratio: 2/3;
		background: var(--bg-tertiary);
		overflow: hidden;
		position: relative;
	}
	
	.game-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}
	
	.game-item:hover .game-cover img {
		transform: scale(1.05);
	}
	
	.game-details {
		padding: 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.game-details h3 {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.game-meta {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: auto;
	}
	
	.achievement-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	
	.progress-bar-mini {
		flex: 1;
		height: 6px;
		background: var(--bg-tertiary);
		border-radius: 3px;
		overflow: hidden;
	}
	
	.progress-fill-mini {
		height: 100%;
		background: linear-gradient(90deg, var(--accent), var(--success));
		transition: width 0.3s;
	}
	
	.progress-text-mini {
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-weight: 600;
		white-space: nowrap;
	}
	
	.loading,
	.no-results {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--text-secondary);
	}
	
	.loading {
		font-size: 1.125rem;
	}
	
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;
		margin: 2rem 0 1rem;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.pagination .button {
		padding: 0.75rem 1.5rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 12px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s;
		box-shadow: 0 2px 8px rgba(88, 166, 255, 0.3);
	}
	
	.pagination .button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(88, 166, 255, 0.4);
	}
	
	.page-info {
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		padding: 0.5rem 1rem;
	}
	
	@media (max-width: 768px) {
		.games-container {
			padding: 1.5rem 1rem;
		}
		
		.games-header h1 {
			font-size: 1.5rem;
		}
		
		.controls {
			padding: 1rem;
			gap: 0.75rem;
		}
		
		.games-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 1rem;
		}
		
		.pagination {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
