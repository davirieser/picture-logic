<script lang="ts">
	import { Nonogram, type NonogramSolveMetrics } from '$lib/solver';
	import { init } from 'z3-solver';
	import { mapXY } from '$lib/util';
	import Timer from '$lib/components/Timer.svelte';

	const nonogram = $state(new Nonogram([[], [], [5], [1], [], []], [[1], [1], [1], [1], [1], [1]]));
	const initialFilledState = {
		cells: mapXY(nonogram.horizontal.length, nonogram.vertical.length, (_) => false)
	};
	let filled = $state(initialFilledState);

	let solving = $state(false);
	let solveStatus = $state<'idle' | 'sat' | 'unsat' | 'unknown' | 'error'>('idle');
	let solveError = $state<string | null>(null);
	let solveMetrics = $state<NonogramSolveMetrics | null>(null);
	const formatMs = (value: number) => `${value.toFixed(2)} ms`;

	// TODO: Put this into onMount and store the solution to check if user completely solved.
	const solveNonogram = async () => {
		solving = true;
		solveStatus = 'idle';
		solveError = null;
		solveMetrics = null;

		try {
			const { Context } = await init();
			const ctx = Context('main');

			const result = await nonogram.solveDetailed(ctx);
			solveMetrics = result.metrics;
			solveStatus = result.status;

			if (result.status === 'sat') {
				filled = { cells: result.cells };
				solved = true;
				timer?.stopTimer();
			} else if (result.status === 'unknown') {
				solveError = 'Z3 could not determine whether this puzzle is solvable.';
			}
		} catch (error) {
			solveStatus = 'error';
			solveError = error instanceof Error ? error.message : 'The solver failed unexpectedly.';
		} finally {
			solving = false;
		}
	};

	let firstClick = $state(true);
	let solved = $state(false);
	const cellClicked = async (x: number, y: number) => {
		if (solved || solving) return;

		filled.cells[x][y] = !filled.cells[x][y];
		// TODO: Check if puzzle is solved and stop timer if so.
		if (firstClick || !timerStarted) {
			firstClick = false;
			timer?.startTimer();
		}
	};
	let timer: Timer | undefined = undefined;
	let timerStarted = $state(false);
	const disabled = $derived(solved || solving);
</script>

<svelte:head>
	<title>Nonogram solver</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
	<section class="flex flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<p class="text-sm font-semibold tracking-wide text-base-content/60 uppercase">Solver</p>
				<h1 class="text-3xl font-bold">Nonogram diagnostics</h1>
			</div>
			<button class="btn" {disabled} onclick={solveNonogram}>
				{solving ? 'Solving...' : solved ? 'Solved' : 'Solve puzzle'}
			</button>
		</div>

		{#if solveStatus === 'unsat'}
			<div class="alert alert-error" role="alert">This puzzle is not solvable.</div>
		{:else if solveStatus === 'unknown' || solveStatus === 'error'}
			<div class="alert alert-warning" role="alert">
				{solveError ?? 'The solver could not complete the request.'}
			</div>
		{:else if solveStatus === 'sat'}
			<div class="alert alert-success" role="status">Solution found.</div>
		{/if}
	</section>

	{#if solveMetrics}
		<section class="flex flex-col gap-3">
			<div>
				<h2 class="text-xl font-semibold">Solve metrics</h2>
				<p class="text-sm text-base-content/60">
					Timings and encoding details from the latest solve.
				</p>
			</div>

			<div
				class="stats w-full stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal"
			>
				<div class="stat">
					<div class="stat-title">Propagation</div>
					<div class="stat-value text-2xl">{formatMs(solveMetrics.propagationMs)}</div>
					<div class="stat-desc">{solveMetrics.forcedCells} forced cells</div>
				</div>
				<div class="stat">
					<div class="stat-title">Encoding</div>
					<div class="stat-value text-2xl">{formatMs(solveMetrics.encodingMs)}</div>
					<div class="stat-desc">{solveMetrics.z3Constraints} constraints</div>
				</div>
				<div class="stat">
					<div class="stat-title">Z3 check</div>
					<div class="stat-value text-2xl">{formatMs(solveMetrics.checkMs)}</div>
					<div class="stat-desc">{solveMetrics.z3Variables} variables</div>
				</div>
				<div class="stat">
					<div class="stat-title">Model</div>
					<div class="stat-value text-2xl">{formatMs(solveMetrics.modelMs)}</div>
					<div class="stat-desc">{solveMetrics.propagationIterations} line passes</div>
				</div>
			</div>

			<dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-box border border-base-300 bg-base-100 p-4">
					<dt class="text-base-content/60">Automaton cache hits</dt>
					<dd class="mt-1 text-lg font-semibold">{solveMetrics.automatonCacheHits}</dd>
				</div>
				<div class="rounded-box border border-base-300 bg-base-100 p-4">
					<dt class="text-base-content/60">Automaton cache misses</dt>
					<dd class="mt-1 text-lg font-semibold">{solveMetrics.automatonCacheMisses}</dd>
				</div>
				<div class="rounded-box border border-base-300 bg-base-100 p-4">
					<dt class="text-base-content/60">Z3 variables</dt>
					<dd class="mt-1 text-lg font-semibold">{solveMetrics.z3Variables}</dd>
				</div>
				<div class="rounded-box border border-base-300 bg-base-100 p-4">
					<dt class="text-base-content/60">Z3 constraints</dt>
					<dd class="mt-1 text-lg font-semibold">{solveMetrics.z3Constraints}</dd>
				</div>
			</dl>
		</section>
	{/if}
</main>
