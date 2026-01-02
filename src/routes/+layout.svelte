<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { PALETTE, THEME } from '$lib/storable';
	import { getPalleteClasses } from '$lib/util';
	import Navbar from '$lib/components/Navbar.svelte';

	let dataTheme = $derived($THEME ? 'dark' : 'light');

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	data-theme={dataTheme}
	class={{
		...getPalleteClasses($PALETTE, 'bg', 50),
		'dark:text-stone-100': true,
		'h-dvh': true,
		'w-dvw': true
	}}
>
	<Navbar />

	<div class="m-5">
		{@render children()}
	</div>
</div>
