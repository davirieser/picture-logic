<script lang="ts">
	import { Nonogram } from '$lib/solver';
	import NC from '$lib/components/Nonogram.svelte';
	import { init } from 'z3-solver';
	import { getPalleteClasses, mapXY } from '$lib/util';
	import Timer from '$lib/components/Timer.svelte';
	import { Button } from 'bits-ui';
	import { PALETTE } from '$lib/storable';

	const nonogram = $state(
		new Nonogram(
			[[], [], [5], [1], [], []],
			[[1], [1], [1], [1], [1], [1]]
		)
	);
	let filled = $state({
		cells: mapXY(nonogram.horizontal.length, nonogram.vertical.length, (_) => false)
	});

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
			} else {
				// TODO: Show error message
				alert("Nonogram is not solvable!");
			}
		}
		catch {
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

<Timer bind:this={timer} bind:started={timerStarted} {disabled} />

<Button.Root
	{disabled}
	class={{
		border: true,
		rounded: true,
		'shadow-mini': true,
		'inline-flex': true,
		'items-center': true,
		'gap-1': true,
		'p-1': true,
		...getPalleteClasses($PALETTE, 'bg', 100),
		...getPalleteClasses($PALETTE, 'bg', 200, undefined, !disabled, "hover"),
		"opacity-75": disabled,
	}}
	onclick={solveNonogram}
>
	{#if solving}
		<span class="icon-[solar--refresh-line-duotone] size-3 animate-spin"></span>
	{/if}
	<span
		class={{
			'inline-block': true,
			'text-sm': true
		}}
	>
		{solving ? 'Solving' : 'Solve'}
	</span>
</Button.Root>
<br />

<NC {nonogram} {filled} {cellClicked} {disabled} />
