import { init } from 'z3-solver';
import { describe, expect, it } from 'vitest';
import { Nonogram } from '$lib/solver';

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
});
