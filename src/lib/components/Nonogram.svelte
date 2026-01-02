<script lang="ts">
	import type { Nonogram, SolvedNonogram } from '$lib/solver';
	import { ENHANCED_BORDER_SPACING, PALETTE } from '$lib/storable';
	import { getPalleteClasses } from '$lib/util';

	type Props = {
		nonogram: Nonogram;
		filled: SolvedNonogram;
		disabled: boolean,
		cellClicked: CellClickedHandler;
	};
	const { nonogram, filled, disabled, cellClicked }: Props = $props();

	type CellClickedHandler = (x: number, y: number) => Promise<void>;

	type CellProps = {
		x: number;
		y: number;
	};
	const isPrimaryButtonClicked = (event: MouseEvent) => (event.buttons & 1) === 1;
	const mouseEventHandler = ({ x, y }: CellProps) => {
		return async (event: MouseEvent) => {
			if (!isPrimaryButtonClicked(event)) return;

			if (cellClicked && !disabled) await cellClicked(x, y);
		};
	};

	const baseCellClasses = $derived({
		'size-6': true,
		'text-center': true,
		border: true,
		...getPalleteClasses($PALETTE, 'border', 400, 500)
	});

	const getBorderClasses = (x: number, y: number) => {
		const condition = (n: number, m: number) => 
			n !== (m - 1) && (n % $ENHANCED_BORDER_SPACING === ($ENHANCED_BORDER_SPACING - 1));
		return {
			'border-e-2': condition(x, nonogram.horizontal.length),
			'border-b-2': condition(y, nonogram.vertical.length),
		};
	}

	const getHighestStack = (n: number[][]) => Math.max(...n.map((s) => s.length));
	const highestStackHorizontal = $derived(getHighestStack(nonogram.horizontal)),
		highestStackVertical = $derived(getHighestStack(nonogram.vertical));
</script>

<table class="m-1">
	<tbody>
		{#each Array.from({ length: Math.max(highestStackHorizontal, 1) }) as _, y}
			<tr>
				{#if y === 0}
					<td
						colspan={Math.max(highestStackVertical, 1)}
						rowspan={Math.max(highestStackHorizontal, 1)}
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 50),
						}}
					></td>
				{/if}
				{#each nonogram.horizontal as stack, x}
					{@const offset = highestStackHorizontal - stack.length}
					{@const n = offset <= y ? stack[y - offset] : null}
					{@render numberCell(n, { x, y: -1 })}
				{/each}
			</tr>
		{/each}
		{#each Array.from({ length: nonogram.vertical.length }) as _, y}
			<tr>
				{#if highestStackVertical === 0}
					{@render numberCell(null, { x: -1, y })}
				{/if}
				{#each Array.from({ length: highestStackVertical - nonogram.vertical[y].length }) as _, x}
					{@render numberCell(null, { x: -1, y })}
				{/each}
				{#each nonogram.vertical[y] as n}
					{@render numberCell(n, { x: -1, y })}
				{/each}
				{#each Array.from({ length: nonogram.horizontal.length }) as _, x}
					{@const f = filled.cells[x][y]}
					<td
						data-x={x}
						data-y={y}
						onmouseenter={mouseEventHandler({ x, y })}
						onmousedown={mouseEventHandler({ x, y })}
						class={{
							...baseCellClasses,
							...getPalleteClasses($PALETTE, 'bg', 700, 700, f),
							...getPalleteClasses($PALETTE, 'bg', 300, 300, !f),
							...getPalleteClasses($PALETTE, 'bg', 800, 900, f && !disabled, "hover"),
							...getPalleteClasses($PALETTE, 'bg', 200, 200, !f && !disabled, "hover"),
							'select-none': true,
							'border-t-2': y === 0,
							'border-s-2': x === 0,
							...getBorderClasses(x, y),
						}}
					></td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

{#snippet numberCell(n: number | null, { x, y }: CellProps)}
	<td
		class={{
			...baseCellClasses,
			...getPalleteClasses($PALETTE, 'bg', 100),
			...getBorderClasses(x, y),
		}}
	>{n}</td>
{/snippet}
