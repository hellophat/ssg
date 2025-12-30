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
	let pastelColor = $state('#ffd1dc'); // Default pastel pink
	
	// Generate random pastel color
	function generatePastelColor() {
		const hue = Math.floor(Math.random() * 360);
		const saturation = 60 + Math.random() * 15; // 60-75%
		const lightness = 80 + Math.random() * 10; // 80-90%
		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}
	
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
		
		// Load stored pastel color or generate new one
		const storedColor = localStorage.getItem('pastelColor');
		if (storedColor) {
			pastelColor = storedColor;
		}
		
		// Apply pastel color if theme is pastel
		if (theme === 'pastel') {
			document.documentElement.style.setProperty('--pastel-bg', pastelColor);
		}
	});
	
	function toggleTheme() {
		// Cycle through: dark -> light -> pastel -> dark
		if (theme === 'dark') {
			theme = 'light';
		} else if (theme === 'light') {
			theme = 'pastel';
			// Generate new random pastel color
			pastelColor = generatePastelColor();
			localStorage.setItem('pastelColor', pastelColor);
			document.documentElement.style.setProperty('--pastel-bg', pastelColor);
		} else {
			theme = 'dark';
		}
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
					<span>Gaming Profile</span>
				</a>
				<div class="nav-center">
					<div class="nav-links">
						<a href="{base}/">Profile</a>
						<a href="{base}/games/1/">Games</a>
						<!-- <a href="{base}/stats/">Stats</a> -->
					</div>
				</div>
			</nav>
		</header>
	{/if}
	
	<!-- Floating theme toggle button -->
	<button class="theme-toggle-floating" onclick={toggleTheme} aria-label="Toggle theme">
		{#if theme === 'dark'}
			☀️
		{:else if theme === 'light'}
			🎨
		{:else}
			🌙
		{/if}
	</button>
	
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
