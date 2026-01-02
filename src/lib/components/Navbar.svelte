<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { PALETTE, THEME } from '$lib/storable';
	import { getPalleteClasses } from '$lib/util';
	import { NavigationMenu } from 'bits-ui';
</script>

<NavigationMenu.Root
	class={{
		relative: true,
		'border-b': true,
		flex: true,
		'justify-between': true,
		'p-1': true,
		...getPalleteClasses($PALETTE, 'bg', 100),
		...getPalleteClasses($PALETTE, 'border', 500)
	}}
>
	<NavigationMenu.List class={{}}>
		<NavigationMenu.Item>
			<NavigationMenu.Link href="/">
				<img src={favicon} class="h-6 w-auto" alt="Nonogram App Icon" />
			</NavigationMenu.Link>
		</NavigationMenu.Item>
	</NavigationMenu.List>
	<NavigationMenu.List
		class={{
			group: true,
			flex: true,
			'list-none': true
		}}
	>
		<NavigationMenu.Item class="h-6 me-2">
			<NavigationMenu.Link
				href="/settings"
				class={{
					'icon-[solar--settings-bold]': true,
					'h-6': true
				}}
			/>
		</NavigationMenu.Item>
		<NavigationMenu.Item class="h-6">
			<NavigationMenu.Link
				onclick={() => ($THEME = !$THEME)}
				class={{
					'icon-[solar--moon-line-duotone]': $THEME,
					'icon-[solar--sun-2-bold]': !$THEME,
					'h-6': true
				}}
			/>
		</NavigationMenu.Item>
		<NavigationMenu.Indicator />
	</NavigationMenu.List>

	<NavigationMenu.Viewport />
</NavigationMenu.Root>
<!--
<nav
	
>
	<div class="mx-auto max-w-7xl px-2">
		<div class="relative flex h-10 items-center justify-between">
			<div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
				<div class="flex shrink-0 items-center">
					<a href="/">
						<img src={favicon} alt="Your Company" class="h-6 w-auto" />
					</a>
				</div>
				<div class="hidden sm:ml-6 sm:block">
					<div class="flex space-x-4">
						<a
							href="#"
							aria-current="page"
							class="rounded-md bg-gray-950/50 px-2 py-1 text-sm font-medium text-white"
							>Dashboard</a
						>
					</div>
				</div>
			</div>
			<div class="absolute inset-y-0 right-0 flex items-center pr-2">
				<div class="flex space-x-4">
					<a
						href="/settings"
						aria-current="page"
						class="rounded-md bg-gray-950/50 px-2 py-1 text-sm font-medium text-white">Settings</a
					>
				</div>
			</div>
		</div>
	</div>
</nav>
-->
