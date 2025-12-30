<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	
	let { children } = $props();
	
	// URL parameters - only accessible in browser
	let compact = $state(false);
	let hideHeader = $state(false);
	
	// Theme state with localStorage persistence
	let theme = $state('dark');
	
	onMount(() => {
		// Get URL parameters (only works in browser)
		const params = new URLSearchParams(window.location.search);
		const urlTheme = params.get('theme');
		compact = params.get('compact') === 'true';
		hideHeader = params.get('hideHeader') === 'true';
		
		// Use URL parameter if provided, otherwise use localStorage or default
		if (urlTheme) {
			theme = urlTheme;
		} else {
			const stored = localStorage.getItem('theme');
			theme = stored || 'dark';
		}
	});
	
	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		localStorage.setItem('theme', theme);
	}
</script>

<svelte:head>
	<title>Steam Profile</title>
	<meta name="description" content="Steam Profile Static Site Generator" />
</svelte:head>

<div class="app" data-theme={theme} class:compact>
	{#if !hideHeader}
		<header>
			<nav>
				<a href="{base}/" class="logo">
					<span class="icon">🎮</span>
					<span>Steam Profile</span>
				</a>
				<div class="nav-center">
					<div class="nav-links">
						<a href="{base}/">Profile</a>
						<a href="{base}/games/1/">Games</a>
						<!-- <a href="{base}/stats/">Stats</a> -->
					</div>
				</div>
				<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
					{#if theme === 'dark'}
						☀️
					{:else}
						🌙
					{/if}
				</button>
			</nav>
		</header>
	{/if}
	
	<main class:no-header={hideHeader}>
		{@render children()}
	</main>
	
	{#if !hideHeader && !compact}
		<footer>
			<p>
				2025 © Steam Profile Static Site Generator.
				<!-- Powered by <a href="https://github.com/upptime/upptime" target="_blank">Upptime</a> architecture
				| Data from <a href="https://steamcommunity.com/" target="_blank">Steam</a> -->
			</p>
		</footer>
	{/if}
</div>
