<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { THEME } from '$lib/storable';
	import SettingsModal from './Settings.svelte';

	interface NavIcon {
		classes?: string;
		path: string;
	}
	interface NavLink {
		href: Parameters<typeof resolve>[0];
		label: string;
		icon: NavIcon;
	}

	const hamIconPath = 'M4 6h16M4 12h16M4 18h16';
	const createIconPath = 'M12 4.5v15m7.5-7.5h-15';
	const uploadIconPath =
		'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5';
	const sunIconPath =
		'M12 3v1.5m0 15V21m8.485-8.485h-1.5M4.515 12H3m15.364 4.95l-1.061-1.061M6.197 6.197L5.136 5.136m12.728 0l-1.061 1.061M6.197 17.803l-1.061 1.061M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9Z';
	const moonIconPath = 'M21 12.79A9 9 0 1 1 11.21 3a7.5 7.5 0 0 0 9.79 9.79Z';
	const navLinks: NavLink[] = [
		{ href: '/create', label: 'Create', icon: { classes: 'size-5', path: createIconPath } },
		{ href: '/upload', label: 'Upload', icon: { classes: 'size-5', path: uploadIconPath } }
	];

	let settingsModal: SettingsModal;

	function openSettings() {
		settingsModal.show();
	}

	function toggleTheme() {
		$THEME = !$THEME;
	}

	function isActive(href: string) {
		return page.url.pathname === href;
	}
	const homeMatches = ['/', '/browse'];
	const isHomeActive = $derived(
		homeMatches.some(
			(path) => page.url.pathname === path || page.url.pathname.startsWith(path + '/')
		)
	);
</script>

<div class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start gap-1">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
				{@render icon('size-6', hamIconPath)}
			</div>
			<ul
				tabindex="-1"
				class="menu dropdown-content z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
			>
				{@render links()}
			</ul>
		</div>
		<a href={resolve('/')} class="btn btn-ghost text-xl" class:btn-active={isHomeActive}
			>picture-logic</a
		>

		<ul class="menu menu-horizontal hidden px-1 lg:flex">
			{@render links()}
		</ul>
	</div>

	<div class="navbar-end gap-1">
		{@render themeController()}
		{@render settingsButton()}
	</div>
</div>

<SettingsModal bind:this={settingsModal} />

{#snippet themeController()}
	<button
		type="button"
		class="btn btn-circle btn-ghost"
		aria-label="Toggle theme"
		onclick={toggleTheme}
	>
		{#if $THEME}
			{@render icon('size-6', sunIconPath)}
		{:else}
			{@render icon('size-6', moonIconPath)}
		{/if}
	</button>
{/snippet}

{#snippet settingsButton()}
	<button
		type="button"
		class="btn btn-circle btn-ghost"
		aria-label="Open settings"
		onclick={openSettings}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="size-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.752.43.992l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.216.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.752-.43-.992l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
			/>
		</svg>
	</button>
{/snippet}

{#snippet links()}
	{#each navLinks as link (link.href)}
		<li>
			<a href={resolve(link.href)} class="gap-2" class:menu-active={isActive(link.href)}>
				{@render navIcon(link.icon, 'size-5')}
				{link.label}
			</a>
		</li>
	{/each}
{/snippet}

{#snippet navIcon(_icon: NavIcon, classes: string)}
	{@render icon(`${_icon.classes} ${classes}`, _icon.path)}
{/snippet}

{#snippet icon(classes: string, path: string)}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class={classes}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d={path} />
	</svg>
{/snippet}
