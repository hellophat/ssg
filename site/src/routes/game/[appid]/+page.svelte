<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let game: any = $state(null);
	let achievements: any = $state(null);
	let loading = $state(true);
	let error = $state('');
	let flippedCards = $state(new Set<string>()); // Track which cards are flipped
	let sortOption = $state('unlock-date'); // 'unlock-date' or 'name'
	let allFlipped = $state(false);
	
	let appid = $derived($page.params.appid);
	
	function toggleCard(apiname: string) {
		if (flippedCards.has(apiname)) {
			flippedCards.delete(apiname);
		} else {
			flippedCards.add(apiname);
		}
		flippedCards = new Set(flippedCards); // Trigger reactivity
	}
	
	function toggleAllCards() {
		if (allFlipped) {
			// Unflip all
			flippedCards.clear();
			allFlipped = false;
		} else {
			// Flip all
			if (achievements?.achievements) {
				achievements.achievements.forEach((ach: any) => {
					flippedCards.add(ach.apiname);
				});
			}
			allFlipped = true;
		}
		flippedCards = new Set(flippedCards); // Trigger reactivity
	}
	
	// Sorted achievements based on selected option
	let sortedAchievements = $derived.by(() => {
		if (!achievements?.achievements) return [];
		
		const list = [...achievements.achievements];
		
		if (sortOption === 'unlock-date') {
			// Sort by unlock time (most recent first), unlocked achievements first
			list.sort((a, b) => {
				if (a.achieved === b.achieved) {
					return (b.unlocktime || 0) - (a.unlocktime || 0);
				}
				return b.achieved - a.achieved; // Unlocked (1) before locked (0)
			});
		} else if (sortOption === 'name') {
			// Sort alphabetically
			list.sort((a, b) => {
				const nameA = a.displayName || a.name || a.apiname || '';
				const nameB = b.displayName || b.name || b.apiname || '';
				return nameA.localeCompare(nameB);
			});
		} else if (sortOption === 'global-percent') {
			// Sort by global percentage (rarest first)
			list.sort((a, b) => {
				const percentA = a.globalPercent ?? 100;
				const percentB = b.globalPercent ?? 100;
				return percentA - percentB;
			});
		}
		
		return list;
	});
	
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
					
					<div class="achievement-controls">
						<button class="control-button" onclick={toggleAllCards}>
							{allFlipped ? '🔄 Flip All Back' : '🔄 Flip All Cards'}
						</button>
						
						<div class="sort-control">
							<label for="achievement-sort">Sort by:</label>
							<select 
								id="achievement-sort" 
								bind:value={sortOption}
								class="sort-select"
							>
								<option value="unlock-date">Unlock Date</option>
								<option value="name">Name (A-Z)</option>
								<option value="global-percent">Rarity (Rarest First)</option>
							</select>
						</div>
					</div>
				</div>
				
				<div class="achievements-grid">
					{#each sortedAchievements as achievement}
						<div 
							class="achievement-item card" 
							class:achieved={achievement.achieved === 1}
							class:flipped={flippedCards.has(achievement.apiname)}
							onclick={() => toggleCard(achievement.apiname)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && toggleCard(achievement.apiname)}
						>
							<div class="flip-card-inner">
								<!-- Front of card -->
								<div class="flip-card-front">
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
								
								<!-- Back of card -->
								<div class="flip-card-back">
									<div class="global-stats">
										<!-- <h3>Global Statistics</h3> -->
										{#if achievement.globalPercent !== null && achievement.globalPercent !== undefined}
											<div class="global-percent">
												<div class="percent-value">{achievement.globalPercent.toFixed(1)}%</div>
												<div class="percent-label">of players unlocked</div>
											</div>
											<div class="rarity-bar">
												<div 
													class="rarity-fill" 
													class:common={achievement.globalPercent >= 50}
													class:uncommon={achievement.globalPercent >= 25 && achievement.globalPercent < 50}
													class:rare={achievement.globalPercent >= 10 && achievement.globalPercent < 25}
													class:epic={achievement.globalPercent >= 5 && achievement.globalPercent < 10}
													class:legendary={achievement.globalPercent < 5}
													style="width: {Math.min(achievement.globalPercent, 100)}%"
												></div>
											</div>
											<!-- <div class="rarity-label">
												{#if achievement.globalPercent >= 50}
													<span class="common">● Common</span>
												{:else if achievement.globalPercent >= 25}
													<span class="uncommon">● Uncommon</span>
												{:else if achievement.globalPercent >= 10}
													<span class="rare">● Rare</span>
												{:else if achievement.globalPercent >= 5}
													<span class="epic">● Epic</span>
												{:else}
													<span class="legendary">● Legendary</span>
												{/if}
											</div> -->
										{:else}
											<div class="no-data">Global statistics unavailable</div>
										{/if}
									</div>
								</div>
							</div>
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
		margin-bottom: 1.25rem;
	}
	
	.achievement-controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		padding-top: 1.25rem;
		border-top: 1px solid var(--border-color);
		margin-top: 1.25rem;
	}
	
	.control-button {
		padding: 0.75rem 1.5rem;
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 2px solid var(--border-color);
		border-radius: 12px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	
	.control-button:hover {
		background: var(--bg-primary);
		border-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(88, 166, 255, 0.2);
	}
	
	.control-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	}
	
	.sort-control {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		border-radius: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	
	.sort-control:hover {
		background: var(--bg-primary);
		border-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(88, 166, 255, 0.2);
	}
	
	.sort-control label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.sort-select {
		padding: 0.25rem 0.5rem;
		background: transparent;
		color: var(--text-primary);
		border: none;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: color 0.3s;
		outline: none;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
	}
	
	.sort-select:hover {
		color: var(--accent);
	}
	
	.sort-select:focus {
		color: var(--accent);
	}
	
	.achievements-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}
	
	.achievement-item {
		position: relative;
		opacity: 0.5;
		transition: opacity 0.3s;
		cursor: pointer;
		perspective: 1000px;
		min-height: 120px;
		/* Override global .card styles */
		background: transparent !important;
		border: none !important;
		padding: 0 !important;
		box-shadow: none !important;
	}
	
	.achievement-item.achieved {
		opacity: 1;
	}
	
	.achievement-item:hover .flip-card-inner {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.flip-card-inner {
		position: relative;
		width: 100%;
		min-height: 120px;
		transition: transform 0.6s;
		transform-style: preserve-3d;
	}
	
	.achievement-item.achieved .flip-card-inner {
		border-color: var(--success);
	}
	
	.achievement-item.flipped .flip-card-inner {
		transform: rotateY(180deg);
	}
	
	.flip-card-front,
	.flip-card-back {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		min-height: 120px;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: 16px;
		padding: 1.25rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
		transition: box-shadow 0.3s;
	}
	
	.achievement-item:hover .flip-card-front,
	.achievement-item:hover .flip-card-back {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.achievement-item.achieved .flip-card-front,
	.achievement-item.achieved .flip-card-back {
		border-color: var(--success);
	}
	
	.flip-card-front {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	
	.flip-card-back {
		transform: rotateY(180deg);
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow: hidden;
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
		z-index: 1;
	}
	
	.global-stats {
		text-align: center;
		width: 100%;
		max-width: 100%;
	}
	
	.global-stats h3 {
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--text-primary);
	}
	
	.percent-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent);
		margin-bottom: 0.25rem;
		line-height: 1;
	}
	
	.percent-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}
	
	.rarity-bar {
		width: 100%;
		height: 10px;
		background: var(--bg-tertiary);
		border-radius: 5px;
		overflow: hidden;
		margin-bottom: 0.5rem;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.rarity-fill {
		height: 100%;
		transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 5px;
	}
	
	.rarity-fill.common {
		background: linear-gradient(90deg, #b0b0b0, #d4d4d4);
	}
	
	.rarity-fill.uncommon {
		background: linear-gradient(90deg, #5cb85c, #6fdd6f);
	}
	
	.rarity-fill.rare {
		background: linear-gradient(90deg, #5bc0de, #7fd9f0);
	}
	
	.rarity-fill.epic {
		background: linear-gradient(90deg, #9b59b6, #b77dcc);
	}
	
	.rarity-fill.legendary {
		background: linear-gradient(90deg, #f0ad4e, #ffc870);
	}
	
	.rarity-label {
		font-size: 0.8rem;
		font-weight: 600;
	}
	
	.rarity-label .common {
		color: #b0b0b0;
	}
	
	.rarity-label .uncommon {
		color: #5cb85c;
	}
	
	.rarity-label .rare {
		color: #5bc0de;
	}
	
	.rarity-label .epic {
		color: #9b59b6;
	}
	
	.rarity-label .legendary {
		color: #f0ad4e;
	}
	
	.no-data {
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-style: italic;
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
