<script lang="ts">
	import { Nonogram } from '$lib/solver';
	import NC from '$lib/components/Nonogram.svelte';
	import { init } from 'z3-solver';
	import { mapXY } from '$lib/util';
	import Timer from '$lib/components/Timer.svelte';

	const nonogram = $state(
		new Nonogram(
			[[1, 2, 3, 4], [1, 2], [3], []],
			[
				[1, 2, 3],
				[1, 2],
				[2, 3]
			]
		)
	);
	let filled = $state({
		cells: mapXY(nonogram.horizontal.length, nonogram.vertical.length, (_) => false)
	});

	const solveNonogram = async () => {
		const { Context } = await init();
		const ctx = Context('main');

		const start = performance.now();

		const result = await nonogram.solve(ctx);
		if (result !== 'unsat') {
			filled = result;
			solved = true;
			timer?.stopTimer();
		} else {
			// TODO: Show error message
		}

		const end = performance.now();
		const elapsed = end - start;

		console.log(`Elapsed time: ${elapsed.toFixed(2)}ms`);
	};

	let firstClick = $state(true);
	let solved = $state(false);
	const cellClicked = async (x: number, y: number) => {
		if (solved) return;

		filled.cells[x][y] = !filled.cells[x][y];
		// TODO: Check if puzzle is solved and stop timer if so.
		if (firstClick || !timerStarted) {
			firstClick = false;
			timer?.startTimer();
		}
	};
	let timer: Timer | undefined = undefined;
	let timerStarted = $state(false);
</script>

<Timer bind:this={timer} bind:started={timerStarted} disabled={solved} />

<button onclick={solveNonogram}>Solve</button>
<br />

<NC {nonogram} {filled} {cellClicked} />

<style>
	button {
		font-size: 2em;
	}
</style>
