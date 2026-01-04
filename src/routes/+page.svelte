<script lang="ts">
	import { Nonogram } from '$lib/solver';
	import NC from '$lib/components/Nonogram.svelte';
	import { init } from 'z3-solver';
	import { getPalleteClasses, mapXY } from '$lib/util';
	import Timer from '$lib/components/Timer.svelte';
	import { Button, Separator, Toolbar } from 'bits-ui';
	import { PALETTE } from '$lib/storable';

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

<NC {nonogram} {filled} {cellClicked} {disabled} />

<Toolbar.Root
	class={{
		rounded: true,
		'border-border': true,
		'bg-background-alt': true,
		'shadow-mini': true,
		'w-fit': true,
		flex: true,
		'items-center': true,
		'justify-center': true,
		border: true,
		'p-0': true
	}}
>
	<div class="flex items-center">
		<Toolbar.Button
			{disabled}
			class={{
				'rounded-9px': true,
				'text-foreground/80': true,
				'hover:bg-muted': true,
				'active:bg-dark-10': true,
				'inline-flex': true,
				'items-center': true,
				'justify-center': true,
				'p-1': true,
				'text-sm': true,
				'font-normal': true,
				'transition-all': true,
				'active:scale-[0.95]': !disabled,
				'opacity-75': disabled
			}}
			onclick={solveNonogram}
		>
			<span class="icon-[ri--lightbulb-ai-line]"></span>
			<span>Solve</span>
		</Toolbar.Button>
	</div>
</Toolbar.Root>

<div class="mt-2 flex gap-1">
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
			...getPalleteClasses($PALETTE, 'bg', 200, undefined, !disabled, 'hover'),
			'opacity-75': disabled
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
			...getPalleteClasses($PALETTE, 'bg', 200, undefined, !disabled, 'hover'),
			'opacity-75': disabled
		}}
		onclick={() => {
			filled = initialFilledState;
			timer?.setTime(0);
		}}
	>
		<span class="icon-[solar--restart-circle-bold-duotone]"></span>
		<span
			class={{
				'inline-block': true,
				'text-sm': true
			}}
		>
			Reset
		</span>
	</Button.Root>
</div>
