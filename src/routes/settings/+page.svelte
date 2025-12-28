<script lang="ts">
    import { PALETTE } from "$lib/storable";
	import { getPalleteClasses, PALETTES } from "$lib/util";
</script>

<label for="palette-select" class="block text-sm/6 font-medium">
    Color Palette
</label>
<select bind:value={$PALETTE} id="palette-select">
    {#each PALETTES as palette}
        <option class={getPalleteClasses(palette, "bg", 200)}>{palette}</option>
    {/each}
</select>
