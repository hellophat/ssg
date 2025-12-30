<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let game: any = $state(null);
	let achievements: any = $state(null);
	let loading = $state(true);
	let error = $state('');
	
	let appid = $derived($page.params.appid);
	
	onMount(async () => {
		try {
			// Load all games to find this game
			const gamesRes = await fetch(`${base}/api/games.json`);
			if (gamesRes.ok) {
				const gamesData = await gamesRes.json();
				game = gamesData.games.find((g: any) => String(g.appid) === appid);
			}
			
			// Load achievements if available
			const achievementsRes = await fetch(`${base}/history/achievements/${appid}.json`);
			if (achievementsRes.ok) {
				achievements = await achievementsRes.json();
			}
			
			loading = false;
		} catch (err) {
			error = 'Failed to load game data';
			loading = false;
		}
	});
	
	function formatPlaytime(minutes: number) {
		const hours = Math.round(minutes / 60);
		if (hours < 1) return `${minutes} minutes`;
		return `${hours.toLocaleString()} hours`;
	}
	
	function formatDate(timestamp: number) {
		if (!timestamp) return 'Never';
		return new Date(timestamp * 1000).toLocaleDateString();
	}
	
	let achievedCount = $derived(achievements?.achievements?.filter((a: any) => a.achieved === 1).length || 0);
	let totalAchievements = $derived(achievements?.achievements?.length || 0);
	let achievementProgress = $derived(totalAchievements > 0 ? (achievedCount / totalAchievements) * 100 : 0);
</script>

<div class="game-container">
	{#if loading}
		<div class="loading">Loading game details...</div>
	{:else if error || !game}
		<div class="error card">
			<h2>Game not found</h2>
			<p>{error || 'Unable to load game details'}</p>
			<a href="{base}/games/1/" class="button">← Back to Games</a>
		</div>
	{:else}
		<div class="game-header">
			<div class="cover-large">
				<img 
					src="{base}/covers/{game.appid}.jpg" 
					alt={game.name}
					onerror={(e) => e.currentTarget.style.display = 'none'}
				/>
			</div>
			
			<div class="game-info card">
				<h1>{game.name}</h1>
				
				<div class="stats">
					<div class="stat">
						<span class="label">Total Playtime</span>
						<span class="value">⏱️ {formatPlaytime(game.playtime_forever || 0)}</span>
					</div>
					
					{#if game.rtime_last_played}
						<div class="stat">
							<span class="label">Last Played</span>
							<span class="value">📅 {formatDate(game.rtime_last_played)}</span>
						</div>
					{/if}
					
					<div class="stat">
						<span class="label">App ID</span>
						<span class="value">{game.appid}</span>
					</div>
				</div>
				
				<div class="actions">
					<a 
						href="https://store.steampowered.com/app/{game.appid}/" 
						target="_blank" 
						class="button"
					>
						View on Steam Store
					</a>
				</div>
			</div>
		</div>
		
		{#if achievements && totalAchievements > 0}
			<div class="achievements-section">
				<div class="achievements-header card">
					<h2>🏆 Achievements</h2>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {achievementProgress}%"></div>
					</div>
					<p class="progress-text">
						{achievedCount} / {totalAchievements} ({achievementProgress.toFixed(1)}%)
					</p>
				</div>
				
				<div class="achievements-grid">
					{#each achievements.achievements as achievement}
						<div class="achievement-item card" class:achieved={achievement.achieved === 1}>
							<div class="achievement-icon">
								<img 
									src={achievement.icon} 
									alt={achievement.displayName || achievement.apiname} 
									loading="lazy"
									onerror={(e) => e.currentTarget.style.display = 'none'}
								/>
							</div>
							<div class="achievement-info">
								<h3>{achievement.displayName || achievement.name || achievement.apiname}</h3>
								{#if achievement.description}
									<p class="description">{achievement.description}</p>
								{/if}
								{#if achievement.achieved === 1 && achievement.unlocktime}
									<p class="unlock-date">
										Unlocked: {formatDate(achievement.unlocktime)}
									</p>
								{/if}
							</div>
							{#if achievement.achieved === 1}
								<div class="check-mark">✓</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="no-achievements card">
				<p>This game doesn't have achievements or achievement data is not available.</p>
			</div>
		{/if}
		
		<div class="back-link">
			<a href="{base}/games/1/" class="button">← Back to Games</a>
		</div>
	{/if}
</div>

<style>
	.game-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.loading, .error {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--text-secondary);
		font-size: 1.125rem;
	}
	
	.error {
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		padding: 3rem 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.error h2 {
		color: var(--error);
		margin-bottom: 1rem;
	}
	
	.game-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		animation: fadeIn 0.5s ease-in;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.cover-large {
		width: 280px;
		aspect-ratio: 2/3;
		background: var(--bg-tertiary);
		border-radius: 16px;
		overflow: hidden;
		border: 3px solid var(--border-color);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		transition: transform 0.3s;
	}
	
	.cover-large:hover {
		transform: scale(1.03);
	}
	
	.cover-large img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.game-info {
		width: 100%;
		text-align: center;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.game-info h1 {
		margin-bottom: 1.5rem;
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--bg-tertiary);
		border-radius: 12px;
		transition: all 0.3s;
	}
	
	.stat:hover {
		background: var(--bg-primary);
	}
	
	.stat .label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.stat .value {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--text-primary);
	}
	
	.actions {
		display: flex;
		justify-content: center;
	}
	
	.button {
		padding: 0.875rem 1.75rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 12px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s;
		box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
		display: inline-block;
	}
	
	.button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(88, 166, 255, 0.4);
	}
	
	.achievements-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		animation: fadeIn 0.6s ease-in 0.1s both;
	}
	
	.achievements-header {
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.achievements-header h2 {
		margin-bottom: 1.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		color: var(--text-primary);
	}
	
	.progress-bar {
		width: 100%;
		height: 28px;
		background: var(--bg-tertiary);
		border-radius: 14px;
		overflow: hidden;
		margin-bottom: 0.75rem;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--accent), var(--success));
		transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 0 10px rgba(88, 166, 255, 0.5);
	}
	
	.progress-text {
		text-align: center;
		color: var(--text-primary);
		font-size: 1rem;
		font-weight: 600;
	}
	
	.achievements-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}
	
	.achievement-item {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		padding: 1.25rem;
		position: relative;
		opacity: 0.5;
		transition: all 0.3s;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 16px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	}
	
	.achievement-item.achieved {
		opacity: 1;
		border-color: var(--success);
	}
	
	.achievement-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.achievement-icon {
		width: 64px;
		height: 64px;
		flex-shrink: 0;
		border-radius: 12px;
		overflow: hidden;
		background: var(--bg-tertiary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
	
	.achievement-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.achievement-info {
		flex: 1;
		min-width: 0;
	}
	
	.achievement-info h3 {
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
		color: var(--text-primary);
	}
	
	.description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 0.25rem;
	}
	
	.unlock-date {
		font-size: 0.75rem;
		color: var(--success);
		font-weight: 600;
	}
	
	.check-mark {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 28px;
		height: 28px;
		background: var(--success);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(63, 185, 80, 0.4);
	}
	
	.no-achievements {
		text-align: center;
		padding: 3rem 2rem;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.back-link {
		text-align: center;
		margin: 1rem 0;
	}
	
	@media (max-width: 768px) {
		.game-container {
			padding: 1.5rem 1rem;
		}
		
		.cover-large {
			width: 100%;
			max-width: 280px;
		}
		
		.game-info {
			padding: 1.5rem;
		}
		
		.game-info h1 {
			font-size: 1.5rem;
		}
		
		.achievements-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
