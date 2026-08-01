<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { THEME } from '$lib/storable';

	let dataTheme = $derived($THEME ? 'dark' : 'light');

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	data-theme={dataTheme}
	class={{
		'dark:text-stone-100': true,
		'h-dvh': true,
		'w-dvw': true
	}}
>
	<div class="navbar bg-base-100 shadow-sm">
		<div class="navbar-start">
			<div class="dropdown">
				<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h8m-8 6h16"
						/>
					</svg>
				</div>
				<ul
					tabindex="-1"
					class="menu dropdown-content z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a>Item 1</a></li>
					<li>
						<a>Parent</a>
						<ul class="p-2">
							<li><a>Submenu 1</a></li>
							<li><a>Submenu 2</a></li>
						</ul>
					</li>
					<li><a>Item 3</a></li>
				</ul>
			</div>
			<a>Picture logic</a>
		</div>
		<div class="navbar-center hidden lg:flex">
			<ul class="menu menu-horizontal px-1">
				<li><a>Item 1</a></li>
				<li>
					<details>
						<summary>Parent</summary>
						<ul class="z-1 w-40 bg-base-100 p-2">
							<li><a>Submenu 1</a></li>
							<li><a>Submenu 2</a></li>
						</ul>
					</details>
				</li>
				<li><a>Item 3</a></li>
			</ul>
		</div>
		<div class="navbar-end">
			<a class="btn">Button</a>
		</div>
	</div>
	<div class="m-5">
		{@render children()}
	</div>
</div>
