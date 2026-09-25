<!-- src/lib/components/Nonogram.svelte -->
<script lang="ts">
	import { Nonogram as NonogramDef } from '$lib/solver';

	export type CellState = 0 | 1 | 2; // 0 = empty, 1 = filled, 2 = marked (X)

	interface Props {
		nonogram: NonogramDef;
		readonly?: boolean;
		onCellClick?: (row: number, col: number, state: CellState) => void;
		filled?: CellState[][];
		cellSizeMin?: number;
		class?: Record<string, boolean | string>;
	}

	let {
		nonogram,
		readonly = false,
		onCellClick,
		filled = $bindable(initFilled(nonogram)),
		cellSizeMin = 24,
		class: classes = {}
	}: Props = $props();

	function initFilled(n: NonogramDef): CellState[][] {
		const rows = n.vertical.length;
		const cols = n.horizontal.length;
		return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0 as CellState));
	}

	$effect(() => {
		const rows = nonogram.vertical.length;
		const cols = nonogram.horizontal.length;
		if (filled.length !== rows || filled.some((r) => r.length !== cols)) {
			filled = initFilled(nonogram);
		}
	});

	const rows = $derived(nonogram.vertical.length);
	const cols = $derived(nonogram.horizontal.length);

	const maxTopClueLines = $derived(
		nonogram.horizontal.reduce((max, clue) => Math.max(max, clue.length), 1)
	);
	const maxLeftClueLines = $derived(
		nonogram.vertical.reduce((max, clue) => Math.max(max, clue.length), 1)
	);

	let dragState: { active: boolean; targetState: CellState; touched: Set<string> } = {
		active: false,
		targetState: 1,
		touched: new Set()
	};

	function nextState(current: CellState, button: number): CellState {
		if (button === 2) {
			return current === 2 ? 0 : 2;
		}
		return current === 1 ? 0 : 1;
	}

	function applyCell(row: number, col: number, state: CellState) {
		if (readonly) return;
		if (!filled[row]) return;
		if (filled[row][col] === state) return;
		filled[row][col] = state;
		filled = filled.map((r) => [...r]);
		onCellClick?.(row, col, state);
	}

	function handlePointerDown(row: number, col: number, e: PointerEvent) {
		if (readonly) return;
		e.preventDefault();
		const current = filled[row]?.[col] ?? 0;
		const target = nextState(current, e.button);
		dragState = { active: true, targetState: target, touched: new Set([`${row}-${col}`]) };
		applyCell(row, col, target);
	}

	function handlePointerEnter(row: number, col: number) {
		if (readonly || !dragState.active) return;
		const key = `${row}-${col}`;
		if (dragState.touched.has(key)) return;
		dragState.touched.add(key);
		applyCell(row, col, dragState.targetState);
	}

	function handlePointerUp() {
		dragState = { active: false, targetState: 1, touched: new Set() };
	}

	function cellFromPoint(clientX: number, clientY: number): { row: number; col: number } | null {
		const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
		if (!el) return null;
		const cellEl = el.closest<HTMLElement>('[data-row][data-col]');
		if (!cellEl) return null;
		const row = Number(cellEl.dataset.row);
		const col = Number(cellEl.dataset.col);
		if (Number.isNaN(row) || Number.isNaN(col)) return null;
		return { row, col };
	}

	function handleTouchStart(row: number, col: number, e: TouchEvent) {
		if (readonly) return;
		e.preventDefault();
		const current = filled[row]?.[col] ?? 0;
		const target = nextState(current, 0);
		dragState = { active: true, targetState: target, touched: new Set([`${row}-${col}`]) };
		applyCell(row, col, target);
	}

	function handleTouchMove(e: TouchEvent) {
		if (readonly || !dragState.active) return;
		e.preventDefault();
		const touch = e.touches[0];
		if (!touch) return;
		const cell = cellFromPoint(touch.clientX, touch.clientY);
		if (!cell) return;
		const key = `${cell.row}-${cell.col}`;
		if (dragState.touched.has(key)) return;
		dragState.touched.add(key);
		applyCell(cell.row, cell.col, dragState.targetState);
	}

	function handleTouchEnd() {
		dragState = { active: false, targetState: 1, touched: new Set() };
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
	}
</script>

<svelte:window onpointerup={handlePointerUp} ontouchend={handleTouchEnd} />

{#snippet clueList(clue: number[])}
	<div
		class="flex h-full flex-col items-end justify-end gap-0.5 px-1 text-xs leading-none sm:text-sm"
	>
		{#each clue as n, i (i)}
			<span class="font-semibold">{n}</span>
		{/each}
	</div>
{/snippet}

{#snippet clueRow(clue: number[])}
	<div
		class="flex h-full w-full flex-row items-end justify-end gap-1 text-xs leading-none sm:text-sm"
	>
		{#each clue as n, i (i)}
			<span class="font-semibold">{n}</span>
		{/each}
	</div>
{/snippet}

<div
	class={['nonogram-grid mx-auto grid w-full max-w-full touch-none select-none', classes]}
	style={`
        --cell-min: ${cellSizeMin}px;
        grid-template-columns: minmax(calc(var(--cell-min) * ${maxLeftClueLines}), auto) repeat(${cols}, minmax(var(--cell-min), 1fr));
        grid-template-rows: minmax(calc(var(--cell-min) * ${maxTopClueLines}), auto) repeat(${rows}, minmax(var(--cell-min), 1fr));
    `}
	oncontextmenu={handleContextMenu}
	role="grid"
	tabindex="-1"
>
	<div class="border-r border-b border-base-300"></div>

	{#each nonogram.horizontal as clue, col (col)}
		<div
			class={{
				'flex items-end justify-center border-b border-base-300 p-0.5': true,
				'border-r-2': col > 0 && col % 5 === 0
			}}
		>
			{@render clueRow(clue)}
		</div>
	{/each}

	{#each nonogram.vertical as clue, row (row)}
		<div
			class={{
				'flex items-center justify-end border-r border-base-300 p-0.5': true,
				'border-b-2': row > 0 && row % 5 === 0
			}}
		>
			{@render clueList(clue)}
		</div>

		{#each nonogram.horizontal as _, col (col)}
			<button
				type="button"
				data-row={row}
				data-col={col}
				aria-label={`cell ${row + 1}, ${col + 1}`}
				class={{
					'flex aspect-square h-full w-full items-center justify-center border border-base-300 transition-colors': true,
					'border-r-2': col > 0 && col % 5 === 0,
					'border-b-2': row > 0 && row % 5 === 0,
					'cursor-pointer bg-base-content hover:opacity-80': filled[row]?.[col] === 1,
					'cursor-pointer bg-base-100 hover:bg-base-200': filled[row]?.[col] === 0 && !readonly,
					'bg-base-100': filled[row]?.[col] === 0 && readonly,
					'cursor-not-allowed bg-base-100': readonly
				}}
				disabled={readonly}
				onpointerdown={(e) => handlePointerDown(row, col, e)}
				onpointerenter={() => handlePointerEnter(row, col)}
				ontouchstart={(e) => handleTouchStart(row, col, e)}
				ontouchmove={handleTouchMove}
			>
				{#if filled[row]?.[col] === 2}
					<span class="text-xs font-bold text-error sm:text-base">✕</span>
				{/if}
			</button>
		{/each}
	{/each}
</div>

<style>
	.nonogram-grid {
		touch-action: none;
	}
</style>
