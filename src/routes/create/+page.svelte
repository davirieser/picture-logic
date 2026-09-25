<script lang="ts">
	import Nonogram, { type CellState } from '$lib/components/Nonogram.svelte';
	import { generateEntropyNonogram, type EntropyNonogram } from '$lib/generator';

	let generated = $state<EntropyNonogram | null>(null);
	let filled = $state<CellState[][]>([]);

	function generate() {
		const next = generateEntropyNonogram();
		generated = next;
		filled = Array.from({ length: next.size }, () =>
			Array.from({ length: next.size }, () => 0 as CellState)
		);
	}
</script>

<svelte:head>
	<title>Create nonogram</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
	<section class="flex flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<p class="text-sm font-semibold tracking-wide text-base-content/60 uppercase">Create</p>
				<h1 class="text-3xl font-bold">Entropy nonogram</h1>
			</div>
			<button class="btn" onclick={generate}>Generate puzzle</button>
		</div>
		<p class="max-w-2xl text-base-content/70">
			Generate a new square puzzle with a random size from 10 to 50. The fill density favors
			high-entropy patterns while keeping the puzzle fully random.
		</p>
	</section>

	{#if generated}
		<section class="flex flex-col gap-4">
			<div
				class="stats w-full stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal"
			>
				<div class="stat">
					<div class="stat-title">Size</div>
					<div class="stat-value text-2xl">{generated.size} x {generated.size}</div>
					<div class="stat-desc">Randomly selected</div>
				</div>
				<div class="stat">
					<div class="stat-title">Fill ratio</div>
					<div class="stat-value text-2xl">{(generated.fillRatio * 100).toFixed(1)}%</div>
					<div class="stat-desc">Filled cells</div>
				</div>
				<div class="stat">
					<div class="stat-title">Binary entropy</div>
					<div class="stat-value text-2xl">{generated.entropy.toFixed(3)}</div>
					<div class="stat-desc">0 to 1 scale</div>
				</div>
			</div>

			<section class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6">
				<Nonogram bind:filled nonogram={generated.nonogram} cellSizeMin={14} />
			</section>
		</section>
	{:else}
		<div class="alert alert-info" role="status">Generate a puzzle to begin.</div>
	{/if}
</main>
