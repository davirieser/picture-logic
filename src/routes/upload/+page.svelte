<script lang="ts">
	import { Nonogram } from '$lib/solver';
	import GridWorker from './grid-worker?worker';
	import type { BrightnessWorkerResponse } from './grid-worker';

	let imageUrl: string | null = $state(null);
	let resolution: number = $state(50);
	let threshold_raw: number = $state(50);
	let threshold: number = $derived(Math.round((threshold_raw / 100) * 255));
	let width: number = $state(15);
	let height: number = $state(15);
	let grid: boolean[][] = $state([]);
	let nonogram = $state(null as Nonogram | null);
	let isComputing: boolean = $state(false);
	const isValidNonogram = $derived(
		nonogram && !isComputing && nonogram.horizontal.length > 0 && nonogram.vertical.length > 0
	);
	let isUploading: boolean = $state(false);

	let naturalWidth: number = $state(0);
	let naturalHeight: number = $state(0);

	let brightnessCache: number[] | null = $state(null);

	let fileInput: HTMLInputElement;
	let sourceCanvas: HTMLCanvasElement;

	async function handleUpload() {
		if (!isValidNonogram || !nonogram) return;

		isUploading = true;
		try {
			const formData = new FormData();
			formData.set(
				'nonogram',
				JSON.stringify({ horizontal: nonogram.horizontal, vertical: nonogram.vertical })
			);

			await fetch('?/upload', {
				method: 'POST',
				body: formData
			});
		} finally {
			isUploading = false;
		}
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			brightnessCache = null;
			imageUrl = reader.result as string;
		};
		reader.readAsDataURL(file);
	}

	function forwardClickToInput() {
		fileInput?.click();
	}

	function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	function runsFromLine(line: boolean[]): number[] {
		const runs: number[] = [];
		let current = 0;
		for (const cell of line) {
			if (cell) {
				current += 1;
			} else if (current > 0) {
				runs.push(current);
				current = 0;
			}
		}
		if (current > 0) runs.push(current);
		return runs;
	}

	function gridToNonogram(cells: boolean[][]): Nonogram {
		const h = cells.length;
		const w = h > 0 ? cells[0].length : 0;

		const horizontal: number[][] = [];
		for (let x = 0; x < w; x++) {
			const column: boolean[] = [];
			for (let y = 0; y < h; y++) {
				column.push(cells[y][x]);
			}
			horizontal.push(runsFromLine(column));
		}

		const vertical: number[][] = cells.map((row) => runsFromLine(row));

		return new Nonogram(horizontal, vertical);
	}

	function computeBrightnessInWorker(imageData: ImageData): Promise<BrightnessWorkerResponse> {
		return new Promise((resolve, reject) => {
			const worker = new GridWorker();

			worker.onmessage = (event: MessageEvent<BrightnessWorkerResponse>) => {
				resolve(event.data);
				worker.terminate();
			};
			worker.onerror = (error) => {
				reject(error);
				worker.terminate();
			};

			worker.postMessage({ imageData });
		});
	}

	function brightnessToGrid(
		brightness: number[],
		gridWidth: number,
		gridHeight: number,
		gridThreshold: number
	): boolean[][] {
		const cells: boolean[][] = [];
		for (let y = 0; y < gridHeight; y++) {
			const row: boolean[] = [];
			for (let x = 0; x < gridWidth; x++) {
				row.push(brightness[y * gridWidth + x] < gridThreshold);
			}
			cells.push(row);
		}
		return cells;
	}

	async function processImage(src: string, targetResolution: number) {
		isComputing = true;
		try {
			const img = await loadImage(src);
			naturalWidth = img.naturalWidth;
			naturalHeight = img.naturalHeight;

			const aspectRatio = img.naturalWidth / img.naturalHeight;
			const newWidth =
				aspectRatio >= 1
					? targetResolution
					: Math.max(1, Math.round(targetResolution * aspectRatio));
			const newHeight =
				aspectRatio >= 1
					? Math.max(1, Math.round(targetResolution / aspectRatio))
					: targetResolution;

			const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
			if (!ctx) return;

			sourceCanvas.width = newWidth;
			sourceCanvas.height = newHeight;
			ctx.clearRect(0, 0, newWidth, newHeight);
			ctx.imageSmoothingEnabled = true;
			ctx.drawImage(img, 0, 0, newWidth, newHeight);

			const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
			const { brightness } = await computeBrightnessInWorker(imageData);

			brightnessCache = brightness;
			width = newWidth;
			height = newHeight;

			const newGrid = brightnessToGrid(brightness, newWidth, newHeight, threshold);
			grid = newGrid;
			nonogram = gridToNonogram(newGrid);
		} finally {
			isComputing = false;
		}
	}

	function recomputeGridFromCache(brightnessCache: number[], threshold: number) {
		const newGrid = brightnessToGrid(brightnessCache, width, height, threshold);
		grid = newGrid;
		nonogram = gridToNonogram(newGrid);
	}

	$effect(() => {
		if (!imageUrl || resolution <= 0) return;
		processImage(imageUrl, resolution);
	});

	$effect(() => {
		if (!brightnessCache || threshold_raw < 0 || threshold_raw > 100) return;
		recomputeGridFromCache(brightnessCache, threshold);
	});
</script>

<div class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-2xl font-bold">Image to Nonogram</h1>

	<div class="grid grid-cols-2 gap-6">
		<div>
			<h2 class="mb-2 text-lg font-semibold">Source Image</h2>
			<div
				class="group relative flex aspect-square items-center justify-center rounded border border-gray-300 bg-gray-50 transition-all duration-300 hover:bg-gray-900/10"
			>
				{#if imageUrl}
					<img src={imageUrl} alt="Uploaded source" class="max-h-full max-w-full object-contain" />
				{:else}
					<span class="text-sm text-gray-400 group-hover:hidden">No image uploaded</span>
					<span class="hidden text-sm text-gray-400 group-hover:block">
						<span
							class={{
								'icon-[material-symbols--upload-rounded]': true,
								'size-6': true,
								block: true,
								'place-self-center': true
							}}
						></span>
						Upload image
					</span>
				{/if}
				<div
					class="invisible absolute inset-0 m-1 rounded-lg border border-dashed border-gray-800 group-hover:visible"
				></div>
				<button
					type="button"
					class="absolute inset-0 cursor-pointer"
					aria-label="Upload image"
					onclick={forwardClickToInput}
				></button>
			</div>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="mt-2 hidden"
				onchange={handleFileChange}
			/>
		</div>

		<div>
			<h2 class="mb-2 text-lg font-semibold">Nonogram Preview</h2>
			<div
				class="flex aspect-square items-center justify-center rounded border border-gray-300 bg-gray-50"
			>
				{#if isComputing}
					<span class="text-sm text-gray-400">Computing grid...</span>
				{:else if grid.length > 0}
					<div
						class="grid h-full w-full"
						style={`grid-template-columns: repeat(${width}, 1fr); grid-template-rows: repeat(${height}, 1fr);`}
					>
						<!-- eslint-disable-next-line svelte/require-each-key -->
						{#each grid as row}
							<!-- eslint-disable-next-line svelte/require-each-key -->
							{#each row as cell}
								<div class={cell ? 'bg-black' : 'bg-white'}></div>
							{/each}
						{/each}
					</div>
				{:else}
					<span class="text-sm text-gray-400">No grid generated</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- TODO: Generate better toolbar -->
	<div class="mt-6 flex flex-wrap items-center gap-6">
		<div class="flex items-center gap-2">
			<label for="resolution" class="text-sm font-medium">Nonogram size</label>
			<input
				id="resolution"
				type="number"
				min="1"
				bind:value={resolution}
				class="w-24 rounded border border-gray-300 px-2 py-1"
			/>
			<span class="text-sm text-gray-500">
				{width}&times;{height} px
				{#if naturalWidth > 0}
					<br />
					(from {naturalWidth}&times;{naturalHeight} px)
				{/if}
			</span>
		</div>

		<div class="flex items-center gap-2">
			<label for="threshold" class="text-sm font-medium">Brightness threshold</label>
			<input
				id="threshold"
				type="range"
				min="0"
				max="100"
				bind:value={threshold_raw}
				class="w-40"
			/>
			<span class="w-10 text-sm text-gray-500">{threshold_raw}%</span>
		</div>

		<div class="mt-6">
			<button
				type="button"
				disabled={!isValidNonogram || isUploading}
				onclick={handleUpload}
				class={{
					'rounded px-4 py-2 text-sm font-medium transition-colors': true,
					'cursor-pointer bg-blue-600 text-white hover:bg-blue-700':
						isValidNonogram && !isUploading,
					'cursor-not-allowed bg-gray-200 text-gray-400': !isValidNonogram || isUploading
				}}
			>
				{isUploading ? 'Uploading...' : 'Upload Nonogram'}
			</button>
		</div>
	</div>

	<canvas bind:this={sourceCanvas} class="hidden"></canvas>
</div>
