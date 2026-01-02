<script lang="ts">
    import { ENHANCED_BORDER_SPACING, PALETTE } from "$lib/storable";
	import { getPalleteClasses, PALETTES } from "$lib/util";
</script>

<div class="divide-y divide-white/5">
    <label for="palette-select" class="block">
        <span class="text-gray-700 dark:text-gray-300">Color Palette</span>
        <select bind:value={$PALETTE} id="palette-select" class={{
            block: true,
            "w-full": true,
            "rounded-md": true,
            ...getPalleteClasses($PALETTE, "bg", 200),
            ...getPalleteClasses($PALETTE, "border", 300),
            "shadow-md": true,
            "focus:ring": true,
            "mt-1": true,
        }}>
            {#each PALETTES as palette}
                <option class={getPalleteClasses(palette, "bg", 200)}>{palette}</option>
            {/each}
        </select>
    </label>

    <label for="grid-size" class="block">
        <span class="text-gray-700 dark:text-gray-300">Grid Size</span>
        <input type="number" id="grid-size" bind:value={$ENHANCED_BORDER_SPACING} class={{
            block: true,
            "w-full": true,
            "rounded-md": true,
            ...getPalleteClasses("neutral", "border", 100),
            ...getPalleteClasses("neutral", "bg", 50),
            "shadow-md": true,
            "focus:ring": true,
            "mt-1": true,
        }} />
    </label>
</div>
