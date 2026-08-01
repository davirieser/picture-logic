<script lang="ts">
	import { Nonogram } from '$lib/solver';
	import { init } from 'z3-solver';
	import { mapXY } from '$lib/util';
	import Timer from '$lib/components/Timer.svelte';

	const nonogram = $state(new Nonogram([[], [], [5], [1], [], []], [[1], [1], [1], [1], [1], [1]]));
	const initialFilledState = {
		cells: mapXY(nonogram.horizontal.length, nonogram.vertical.length, (_) => false)
	};
	let filled = $state(initialFilledState);

	let solving = $state(false);
	// TODO: Put this into onMount and store the solution to check if user completely solved.
	const solveNonogram = async () => {
		solving = true;

		try {
			const { Context } = await init();
			const ctx = Context('main');

			const start = performance.now();

			let result: Awaited<ReturnType<typeof nonogram.solve>> = 'unsat';
			result = await nonogram.solve(ctx);

			const end = performance.now();
			const elapsed = end - start;

			if (result !== 'unsat') {
				filled = result;
				solved = true;
				timer?.stopTimer();
			} else {
				// TODO: Show error message
				alert('Nonogram is not solvable!');
			}
		} catch {
			// TODO: Show error message?
		}
		solving = false;
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

<div
	class={{
		flex: true,
		'flex-col': true,
		'justify-center': true,
		'gap-1': true
	}}
></div>
