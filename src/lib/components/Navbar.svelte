<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { PALETTE, THEME } from '$lib/storable';
	import { getPalleteClasses } from '$lib/util';
</script>

<nav
	class={{
		relative: true,
		'border-b': true,
		...getPalleteClasses($PALETTE, 'bg', 100),
		...getPalleteClasses($PALETTE, 'border', 500)
	}}
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
				<div class="flex space-x-4">
                    <button onclick={() => ($THEME = !$THEME)} title="Dark mode" class="px-2 py-1">
                        {#if $THEME}
                            <span class="icon-[solar--moon-line-duotone]"></span>
                        {:else}
                            <span class="icon-[solar--sun-2-bold]"></span>
                        {/if}
                    </button>
				</div>
			</div>
		</div>
	</div>
</nav>
