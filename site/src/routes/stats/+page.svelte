<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	
	Chart.register(...registerables);
	
	let games: any[] = $state([]);
	let achievements: any = $state({});
	let loading = $state(true);
	
	let playtimeChartCanvas: HTMLCanvasElement;
	let achievementChartCanvas: HTMLCanvasElement;
	let topGamesChartCanvas: HTMLCanvasElement;
	
	onMount(async () => {
		try {
			// Load games
			const gamesRes = await fetch(`${base}/api/games.json`);
			if (gamesRes.ok) {
				const data = await gamesRes.json();
				games = data.games || [];
			}
			
			// Load achievements summary
			const achievementsRes = await fetch(`${base}/history/achievements/summary.json`);
			if (achievementsRes.ok) {
				achievements = await achievementsRes.json();
			}
			
			loading = false;
			
			// Create charts after data loaded
			setTimeout(() => {
				createPlaytimeChart();
				createAchievementChart();
				createTopGamesChart();
			}, 100);
		} catch (err) {
			loading = false;
		}
	});
	
	function createPlaytimeChart() {
		if (!playtimeChartCanvas) return;
		
		const topGames = [...games]
			.sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
			.slice(0, 10);
		
		new Chart(playtimeChartCanvas, {
			type: 'bar',
			data: {
				labels: topGames.map(g => g.name),
				datasets: [{
					label: 'Hours Played',
					data: topGames.map(g => Math.round((g.playtime_forever || 0) / 60)),
					backgroundColor: 'rgba(88, 166, 255, 0.6)',
					borderColor: 'rgba(88, 166, 255, 1)',
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: true,
						text: 'Top 10 Most Played Games',
						color: '#c9d1d9',
						font: { size: 16 }
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(48, 54, 61, 0.5)' },
						ticks: { color: '#8b949e' }
					},
					x: {
						grid: { display: false },
						ticks: { 
							color: '#8b949e',
							maxRotation: 45,
							minRotation: 45
						}
					}
				}
			}
		});
	}
	
	function createAchievementChart() {
		if (!achievementChartCanvas) return;
		
		const gamesWithAchievements = achievements.gamesWithAchievements || 0;
		const gamesWithoutAchievements = games.length - gamesWithAchievements;
		
		new Chart(achievementChartCanvas, {
			type: 'doughnut',
			data: {
				labels: ['With Achievements', 'Without Achievements'],
				datasets: [{
					data: [gamesWithAchievements, gamesWithoutAchievements],
					backgroundColor: [
						'rgba(63, 185, 80, 0.6)',
						'rgba(139, 148, 158, 0.3)'
					],
					borderColor: [
						'rgba(63, 185, 80, 1)',
						'rgba(139, 148, 158, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: { color: '#c9d1d9' }
					},
					title: {
						display: true,
						text: 'Games by Achievement Support',
						color: '#c9d1d9',
						font: { size: 16 }
					}
				}
			}
		});
	}
	
	function createTopGamesChart() {
		if (!topGamesChartCanvas) return;
		
		const topGames = [...games]
			.sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
			.slice(0, 5);
		
		new Chart(topGamesChartCanvas, {
			type: 'pie',
			data: {
				labels: topGames.map(g => g.name),
				datasets: [{
					data: topGames.map(g => Math.round((g.playtime_forever || 0) / 60)),
					backgroundColor: [
						'rgba(88, 166, 255, 0.6)',
						'rgba(63, 185, 80, 0.6)',
						'rgba(210, 153, 34, 0.6)',
						'rgba(248, 81, 73, 0.6)',
						'rgba(201, 209, 217, 0.6)'
					],
					borderColor: [
						'rgba(88, 166, 255, 1)',
						'rgba(63, 185, 80, 1)',
						'rgba(210, 153, 34, 1)',
						'rgba(248, 81, 73, 1)',
						'rgba(201, 209, 217, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: { color: '#c9d1d9' }
					},
					title: {
						display: true,
						text: 'Top 5 Games by Playtime',
						color: '#c9d1d9',
						font: { size: 16 }
					}
				}
			}
		});
	}
	
	let totalPlaytime = $derived(games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0));
	let totalHours = $derived(Math.round(totalPlaytime / 60));
	let gamesPlayed = $derived(games.filter(g => (g.playtime_forever || 0) > 0).length);
	let averagePlaytime = $derived(gamesPlayed > 0 ? Math.round(totalHours / gamesPlayed) : 0);
</script>

<div class="stats-container">
	<h1>Statistics & Analytics</h1>
	
	{#if loading}
		<div class="loading">Loading statistics...</div>
	{:else}
		<div class="summary-cards grid grid-3">
			<div class="card stat-card">
				<div class="stat-icon">⏱️</div>
				<div class="stat-value">{totalHours.toLocaleString()}h</div>
				<div class="stat-label">Total Playtime</div>
			</div>
			
			<div class="card stat-card">
				<div class="stat-icon">🎮</div>
				<div class="stat-value">{gamesPlayed}</div>
				<div class="stat-label">Games Played</div>
			</div>
			
			<div class="card stat-card">
				<div class="stat-icon">📊</div>
				<div class="stat-value">{averagePlaytime}h</div>
				<div class="stat-label">Avg per Game</div>
			</div>
		</div>
		
		<div class="charts-grid">
			<div class="chart-card card">
				<div class="chart-container">
					<canvas bind:this={playtimeChartCanvas}></canvas>
				</div>
			</div>
			
			<div class="chart-card card">
				<div class="chart-container small">
					<canvas bind:this={achievementChartCanvas}></canvas>
				</div>
			</div>
			
			<div class="chart-card card">
				<div class="chart-container small">
					<canvas bind:this={topGamesChartCanvas}></canvas>
				</div>
			</div>
		</div>
		
		<div class="insights card">
			<h2>Insights</h2>
			<ul>
				<li>You've spent a total of <strong>{totalHours.toLocaleString()} hours</strong> gaming on Steam</li>
				<li><strong>{gamesPlayed}</strong> out of <strong>{games.length}</strong> games have been played</li>
				<li>Average of <strong>{averagePlaytime} hours</strong> per game played</li>
				{#if achievements.gamesWithAchievements}
					<li><strong>{achievements.gamesWithAchievements}</strong> games have achievement tracking</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style>
	.stats-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	h1 {
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	
	.loading {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--text-secondary);
		font-size: 1.125rem;
	}
	
	.summary-cards {
		margin: 0.5rem 0;
		animation: fadeIn 0.5s ease-in;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.stat-card {
		text-align: center;
		padding: 2rem 1.5rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.stat-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 8px 20px rgba(88, 166, 255, 0.2);
	}
	
	.stat-icon {
		font-size: 3rem;
		margin-bottom: 0.75rem;
		transition: transform 0.3s;
	}
	
	.stat-card:hover .stat-icon {
		transform: scale(1.1);
	}
	
	.stat-value {
		font-size: 2.25rem;
		font-weight: 700;
		color: var(--accent);
		margin-bottom: 0.5rem;
		line-height: 1;
	}
	
	.stat-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.charts-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		animation: fadeIn 0.6s ease-in 0.1s both;
	}
	
	.chart-card {
		padding: 2rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.3s;
	}
	
	.chart-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}
	
	.chart-container {
		height: 400px;
		position: relative;
	}
	
	.chart-container.small {
		height: 320px;
	}
	
	.insights {
		padding: 2rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-color);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		animation: fadeIn 0.7s ease-in 0.2s both;
	}
	
	.insights h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
	}
	
	.insights ul {
		list-style: none;
		padding: 0;
	}
	
	.insights li {
		padding: 1rem;
		margin-bottom: 0.5rem;
		background: var(--bg-tertiary);
		border-radius: 12px;
		color: var(--text-secondary);
		transition: all 0.3s;
	}
	
	.insights li:hover {
		background: var(--bg-primary);
		transform: translateX(5px);
	}
	
	.insights li:last-child {
		margin-bottom: 0;
	}
	
	.insights strong {
		color: var(--text-primary);
		font-weight: 700;
	}
	
	@media (min-width: 768px) {
		.charts-grid {
			grid-template-columns: 1fr 1fr;
		}
		
		.chart-card:first-child {
			grid-column: 1 / -1;
		}
	}
	
	@media (max-width: 768px) {
		.stats-container {
			padding: 1.5rem 1rem;
		}
		
		h1 {
			font-size: 1.5rem;
		}
		
		.stat-card {
			padding: 1.5rem 1rem;
		}
		
		.stat-icon {
			font-size: 2.5rem;
		}
		
		.stat-value {
			font-size: 2rem;
		}
		
		.chart-card {
			padding: 1.5rem;
		}
		
		.insights {
			padding: 1.5rem;
		}
	}
</style>
