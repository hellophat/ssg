<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let profile: any = $state(null);
	let summary: any = $state(null);
	let recentGames: any[] = $state([]);
	let gameAchievements: Record<string, any> = $state({});
	let loading = $state(true);
	let error = $state('');
	
	onMount(async () => {
		try {
			const profileRes = await fetch(`${base}/../api/profile.json`);
			if (profileRes.ok) {
				profile = await profileRes.json();
			}
			
			const summaryRes = await fetch(`${base}/../api/summary.json`);
			if (summaryRes.ok) {
				summary = await summaryRes.json();
			}
			
			const recentRes = await fetch(`${base}/../history/stats/recent-latest.json`);
			if (recentRes.ok) {
				const recentData = await recentRes.json();
				recentGames = recentData.games || [];
				
				// Load achievements for recent games
				const achPromises = recentGames.slice(0, 3).map(async (game) => {
					try {
						const achRes = await fetch(`${base}/../history/achievements/${game.appid}.json`);
						if (achRes.ok) {
							const achData = await achRes.json();
							return { appid: game.appid.toString(), data: achData };
						}
					} catch (e) {
						// Ignore achievement loading errors
					}
					return null;
				});
				
				const achResults = await Promise.all(achPromises);
				const newAchievements: Record<string, any> = {};
				for (const result of achResults) {
					if (result) {
						newAchievements[result.appid] = result.data;
					}
				}
				gameAchievements = newAchievements;
			}
			
			loading = false;
		} catch (err) {
			error = 'Failed to load profile data. Please ensure initial sync has been run.';
			loading = false;
		}
	});
	
	function getAchievementProgress(appid: number) {
		const ach = gameAchievements[appid.toString()];
		if (!ach || !ach.achievements) return null;
		const achieved = ach.achievements.filter((a: any) => a.achieved === 1).length;
		const total = ach.achievements.length;
		return { achieved, total, percentage: total > 0 ? (achieved / total) * 100 : 0 };
	}
	
	function formatDate(timestamp: string) {
		return new Date(timestamp).toLocaleString();
	}
	
	function formatPlaytime(minutes: number) {
		const hours = Math.round(minutes / 60);
		if (hours < 1) return `${minutes}m`;
		return `${hours}h`;
	}
</script>

<!-- Linktree Style Layout -->
<div class="linktree-container">
	{#if loading}
		<div class="loading">
			<div class="loader"></div>
			<p>Loading profile...</p>
		</div>
	{:else if error}
		<div class="link-card error-card">
			<div class="card-icon">⚠️</div>
			<h2>Setup Required</h2>
			<p>{error}</p>
		</div>
	{:else if profile}
		<!-- Profile Avatar & Name -->
		<div class="linktree-profile">
			<div class="profile-avatar">
				<img src={profile.avatarfull} alt={profile.personaname} />
			</div>
			<h1 class="profile-name">{profile.personaname}</h1>
			<p class="profile-subtitle">🎮 Steam Gaming Profile</p>
		</div>
		
		<!-- Stats Summary -->
		{#if summary}
			<div class="linktree-stats">
				<div class="stat-item">
					<span class="stat-num">{summary.stats.totalGames}</span>
					<span class="stat-label">Games</span>
				</div>
				<div class="stat-divider"></div>
				<div class="stat-item">
					<span class="stat-num">{summary.stats.totalPlaytime}h</span>
					<span class="stat-label">Played</span>
				</div>
				<div class="stat-divider"></div>
				<div class="stat-item">
					<span class="stat-num">{summary.stats.gamesWithAchievements}</span>
					<span class="stat-label">Achievements</span>
				</div>
			</div>
		{/if}
		
		<!-- Main Action Links -->
		<div class="linktree-links">
			<a href="{base}/games/1/" class="link-card">
				<span class="link-icon">🎮</span>
				<span class="link-text">Browse Game Library</span>
				<span class="link-arrow">→</span>
			</a>
			
			<!-- <a href="{base}/stats/" class="link-card">
				<span class="link-icon">📊</span>
				<span class="link-text">View Statistics & Charts</span>
				<span class="link-arrow">→</span>
			</a> -->
			
			<a href={profile.profileurl} target="_blank" class="link-card">
				<span class="link-icon">🔗</span>
				<span class="link-text">Visit Steam Profile</span>
				<span class="link-arrow">↗</span>
			</a>
		</div>
		
		<!-- Recently Played Games -->
		{#if recentGames.length > 0}
			<div class="linktree-section">
				<h2 class="section-title">Recently Played</h2>
				<div class="recent-cards">
					{#each recentGames.slice(0, 3) as game}
						<a href="{base}/game/{game.appid}/" class="game-link-card">
							<div class="game-thumb">
								<img 
									src="{base}/covers/{game.appid}.jpg" 
									alt={game.name}
									onerror={(e) => e.currentTarget.style.opacity = '0'}
								/>
							</div>
							<div class="game-link-info">
								<h3>{game.name}</h3>
								<p>{formatPlaytime(game.playtime_forever || 0)} played</p>							{#if getAchievementProgress(game.appid)}
								{@const progress = getAchievementProgress(game.appid)}
								<div class="achievement-progress">
									<div class="progress-bar-mini">
										<div class="progress-fill-mini" style="width: {progress.percentage}%"></div>
									</div>
									<span class="progress-text-mini">🏆 {progress.achieved}/{progress.total}</span>
								</div>
							{/if}							</div>
							<span class="link-arrow">→</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Footer -->
		{#if summary}
			<div class="linktree-footer">
				<p>Last updated {formatDate(summary.lastUpdate)}</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.linktree-container {
		max-width: 680px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		min-height: 80vh;
		background: var(--bg-primary);
	}
	
	.linktree-profile {
		text-align: center;
		margin-bottom: 0.5rem;
		animation: fadeIn 0.5s ease-in;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.profile-avatar {
		width: 120px;
		height: 120px;
		margin: 0 auto 1.25rem;
		border-radius: 50%;
		overflow: hidden;
		border: 4px solid var(--accent);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease;
	}
	
	.profile-avatar:hover {
		transform: scale(1.05);
	}
	
	.profile-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.profile-name {
		font-size: 1.875rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		line-height: 1.2;
	}
	
	.profile-subtitle {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0;
	}
	
	.linktree-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;
		padding: 1.25rem 1.5rem;
		background: var(--bg-secondary);
		border-radius: 20px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		animation: fadeIn 0.6s ease-in 0.1s both;
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	
	.stat-num {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--accent);
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	
	.stat-divider {
		width: 2px;
		height: 40px;
		background: var(--border-color);
		border-radius: 1px;
	}
	
	.linktree-links {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.5rem;
	}
	
	.link-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		text-decoration: none;
		color: var(--text-primary);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.link-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.15), transparent);
		transition: left 0.6s;
	}
	
	.link-card:hover::before {
		left: 100%;
	}
	
	.link-card:hover {
		transform: translateY(-3px) scale(1.02);
		border-color: var(--accent);
		box-shadow: 0 12px 32px rgba(88, 166, 255, 0.25);
	}
	
	.link-card:active {
		transform: translateY(-1px) scale(1.01);
	}
	
	.link-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
		transition: transform 0.3s;
	}
	
	.link-card:hover .link-icon {
		transform: scale(1.1) rotate(-5deg);
	}
	
	.link-text {
		flex: 1;
		font-weight: 600;
		font-size: 1.05rem;
		letter-spacing: -0.01em;
	}
	
	.link-arrow {
		color: var(--text-secondary);
		font-size: 1.5rem;
		transition: all 0.3s;
		font-weight: 600;
	}
	
	.link-card:hover .link-arrow {
		transform: translateX(4px);
		color: var(--accent);
	}
	
	.linktree-section {
		width: 100%;
		margin-top: 1.5rem;
		animation: fadeIn 0.7s ease-in 0.2s both;
	}
	
	.section-title {
		text-align: center;
		font-size: 0.875rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	
	.recent-cards {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
	
	.game-link-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 16px;
		text-decoration: none;
		color: var(--text-primary);
		transition: all 0.3s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	}
	
	.game-link-card:hover {
		transform: translateY(-2px);
		border-color: var(--accent);
		box-shadow: 0 8px 20px rgba(88, 166, 255, 0.2);
	}
	
	.game-thumb {
		width: 64px;
		height: 64px;
		flex-shrink: 0;
		border-radius: 12px;
		overflow: hidden;
		background: var(--bg-tertiary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
	
	.game-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: all 0.3s;
	}
	
	.game-link-card:hover .game-thumb img {
		transform: scale(1.1);
	}
	
	.game-link-info {
		flex: 1;
		min-width: 0;
	}
	
	.game-link-info h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.game-link-info p {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	.achievement-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
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
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 600;
		white-space: nowrap;
	}
	
	.linktree-footer {
		margin-top: 2rem;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.75rem;
		padding: 1rem;
	}
	
	.loading {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}
	
	.loader {
		width: 48px;
		height: 48px;
		border: 4px solid var(--border-color);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.error-card {
		padding: 2rem;
		text-align: center;
		background: var(--bg-secondary);
		border-color: var(--error) !important;
		width: 100%;
		max-width: 480px;
	}
	
	.error-card .card-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.error-card h2 {
		margin-bottom: 0.5rem;
		color: var(--error);
	}
	
	.error-card p {
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.linktree-container {
			padding: 1.5rem 1rem 3rem;
		}
		
		.profile-name {
			font-size: 1.5rem;
		}
		
		.linktree-stats {
			gap: 1rem;
			padding: 1rem;
		}
		
		.stat-num {
			font-size: 1.5rem;
		}
		
		.stat-label {
			font-size: 0.7rem;
		}
		
		.link-card {
			padding: 1rem 1.25rem;
		}
		
		.link-text {
			font-size: 0.95rem;
		}
		
		.link-icon {
			font-size: 1.5rem;
		}
		
		.game-thumb {
			width: 56px;
			height: 56px;
		}
	}
	
	/* Compact mode */
	:global(.compact) .linktree-container {
		padding-top: 1rem;
		padding-bottom: 1rem;
	}
	
	:global(.compact) .linktree-footer {
		margin-top: 1rem;
	}
</style>
