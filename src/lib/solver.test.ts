import { init } from 'z3-solver';
import { describe, expect, it } from 'vitest';
import { Nonogram, NonogramInputError } from '$lib/solver';

describe('Nonogram.solve', () => {
	it('solves exact-fit clues without a trailing separator', async () => {
		const { Context } = await init();
		const puzzle = new Nonogram([[5]], [[1], [1], [1], [1], [1]]);

		const result = await puzzle.solve(Context('exact-fit'));

		expect(result).toEqual({ cells: [[true, true, true, true, true]] });
	});

	it('returns unsat when a clue cannot fit on its line', async () => {
		const { Context } = await init();
		const puzzle = new Nonogram([[2]], [[1]]);

		const result = await puzzle.solve(Context('impossible-line'));

		expect(result).toBe('unsat');
	});

	it('solves empty lines during propagation without using Z3', async () => {
		const { Context } = await init();
		const puzzle = new Nonogram([[], [], []], [[], [], []]);

		const result = await puzzle.solveDetailed(Context('empty-lines'));

		expect(result).toMatchObject({ status: 'sat', metrics: { z3Variables: 0 } });
		if (result.status === 'sat') {
			expect(result.cells).toEqual([
				[false, false, false],
				[false, false, false],
				[false, false, false]
			]);
		}
	});

	it('uses the compact Z3 encoding for an ambiguous puzzle', async () => {
		const { Context } = await init();
		const puzzle = new Nonogram([[1], [1]], [[1], [1]]);

		const result = await puzzle.solveDetailed(Context('ambiguous'));

		expect(result.status).toBe('sat');
		if (result.status === 'sat') {
			expect(result.metrics.z3Variables).toBeGreaterThan(4);
			expect(result.metrics.z3Constraints).toBeGreaterThan(0);
			expect(result.cells.flat().filter(Boolean)).toHaveLength(2);
		}
	});

	it('keeps larger ambiguous grids bounded by automaton states', async () => {
		const { Context } = await init();
		const size = 20;
		const clues = Array.from({ length: size }, () => [1]);
		const puzzle = new Nonogram(clues, clues);

		const result = await puzzle.solveDetailed(Context('larger-ambiguous'));

		expect(result.status).toBe('sat');
		if (result.status === 'sat') {
			const expectedUpperBound = size * size + 2 * size * (size + 1) * 3 + 1;
			expect(result.metrics.z3Variables).toBeLessThan(expectedUpperBound);
		}
	});

	it('detects a contradiction between crossing clues', async () => {
		const { Context } = await init();
		const puzzle = new Nonogram([[1]], [[]]);

		const result = await puzzle.solveDetailed(Context('crossing-contradiction'));

		expect(result.status).toBe('unsat');
		expect(result.metrics.z3Variables).toBe(0);
	});

	it('rejects non-positive clue lengths', () => {
		expect(() => new Nonogram([[0]], [[1]])).toThrow(NonogramInputError);
	});
});
