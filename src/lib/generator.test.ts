import { describe, expect, it } from 'vitest';
import {
	binaryEntropy,
	generateEntropyNonogram,
	MAX_GENERATED_SIZE,
	MIN_GENERATED_SIZE
} from '$lib/generator';

function seededRandom(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 0x100000000;
	};
}

function getRuns(line: readonly boolean[]) {
	const runs: number[] = [];
	let current = 0;
	for (const filled of line) {
		if (filled) current++;
		else if (current > 0) {
			runs.push(current);
			current = 0;
		}
	}
	if (current > 0) runs.push(current);
	return runs;
}

describe('generateEntropyNonogram', () => {
	it('generates a square puzzle within the requested size bounds', () => {
		for (let seed = 1; seed <= 12; seed++) {
			const generated = generateEntropyNonogram(seededRandom(seed));

			expect(generated.size).toBeGreaterThanOrEqual(MIN_GENERATED_SIZE);
			expect(generated.size).toBeLessThanOrEqual(MAX_GENERATED_SIZE);
			expect(generated.solution).toHaveLength(generated.size);
			expect(generated.solution.every((column) => column.length === generated.size)).toBe(true);
			expect(generated.nonogram.horizontal).toHaveLength(generated.size);
			expect(generated.nonogram.vertical).toHaveLength(generated.size);
		}
	});

	it('derives clues that describe the generated solution', () => {
		const generated = generateEntropyNonogram(seededRandom(42));

		expect(generated.nonogram.horizontal).toEqual(generated.solution.map(getRuns));
		expect(generated.nonogram.vertical).toEqual(
			Array.from({ length: generated.size }, (_, row) =>
				getRuns(generated.solution.map((column) => column[row]))
			)
		);
	});

	it('reports normalized binary entropy for the generated fill ratio', () => {
		const generated = generateEntropyNonogram(seededRandom(7));
		const filledCells = generated.solution.flat().filter(Boolean).length;

		expect(generated.fillRatio).toBe(filledCells / (generated.size * generated.size));
		expect(generated.entropy).toBe(binaryEntropy(generated.fillRatio));
		expect(generated.entropy).toBeGreaterThanOrEqual(0);
		expect(generated.entropy).toBeLessThanOrEqual(1);
	});

	it('rejects invalid random values', () => {
		expect(() => generateEntropyNonogram(() => 1)).toThrow(RangeError);
	});
});
