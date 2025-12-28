<script lang="ts">
	import type { Nonogram, SolvedNonogram } from '$lib/solver';
	import { PALETTE } from '$lib/storable';
	import { getPalleteClasses } from '$lib/util';

	const { nonogram, filled, cellClicked }: Props = $props();

	type Props = {
		nonogram: Nonogram;
		filled: SolvedNonogram;
		cellClicked: CellClickedHandler;
	};
	type CellClickedHandler = (x: number, y: number) => Promise<void>;

	type CellProps = {
		x: number;
		y: number;
	};
	const isPrimaryButtonClicked = (event: MouseEvent) => (event.buttons & 1) === 1;
	const mouseEventHandler = ({ x, y }: CellProps) => {
		return async (event: MouseEvent) => {
			if (!isPrimaryButtonClicked(event)) return;

			if (cellClicked) await cellClicked(x, y);
		};
	};

	const baseCellClasses = $derived({
		'size-6': true,
		'text-center': true,
		border: true,
		...getPalleteClasses($PALETTE, 'border', 300, 500)
	});

	const getHighestStack = (n: number[][]) => Math.max(...n.map((s) => s.length));
	const highestStackHorizontal = $derived(getHighestStack(nonogram.horizontal)),
		highestStackVertical = $derived(getHighestStack(nonogram.vertical));
</script>

<table class="m-1">
	<tbody>
		{#each Array.from({ length: highestStackHorizontal }) as _, y}
			<tr>
				{#if y === 0}
					<td
						colspan={highestStackVertical}
						rowspan={highestStackHorizontal}
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 50)
						}}
					></td>
				{/if}
				{#each nonogram.horizontal as stack}
					{@const offset = highestStackHorizontal - stack.length}
					{@const n = offset <= y ? stack[y - offset] : null}
					<td
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 100)
						}}>{n}</td
					>
				{/each}
			</tr>
		{/each}
		{#each Array.from({ length: nonogram.vertical.length }) as _, y}
			<tr>
				{#each Array.from({ length: highestStackVertical - nonogram.vertical[y].length }) as _, y}
					<td
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 100)
						}}
					></td>
				{/each}
				{#each nonogram.vertical[y] as n}
					<td
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 100)
						}}>{n}</td
					>
				{/each}
				{#each Array.from({ length: nonogram.horizontal.length }) as _, x}
					{@const f = filled.cells[x][y]}
					<td
						onmouseenter={mouseEventHandler({ x, y })}
						onmousedown={mouseEventHandler({ x, y })}
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 700, 700, f),
							...getPalleteClasses($PALETTE, 'bg', 200, 200, !f),
							'select-none': true
						}}
					></td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
