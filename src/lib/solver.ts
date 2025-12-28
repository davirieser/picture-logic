import type { Context } from 'z3-solver';
import { mapXY } from '$lib/util';

export interface NonogramCell {
	x: number,
	y: number,
}
export interface NonogramGame {
	nonogram: Nonogram,
	move_history: (NonogramCell | string)[], 
	timeMs?: number,
}

export interface Solvable<Result> {
	solve<Name extends string>(ctx: Context<Name>): Promise<Result | 'unsat'>,
}

export interface SolvedNonogram {
	cells: boolean[][],
}
export class Nonogram implements Solvable<SolvedNonogram> {
	horizontal: number[][] = [];
	vertical: number[][] = [];

	constructor(top: number[][], left: number[][]) {
		this.horizontal = top;
		this.vertical = left;
	}

	async solve<Name extends string>(ctx: Context<Name>) {
		const { Bool, Or, solve, isModel } = ctx;

		const getName = (x: number, y: number) => `x${x}y${y}`;

		const width = this.horizontal.length, height = this.vertical.length;
		const variables = mapXY(width, height, (x, y) => Bool.const(getName(x, y)));

		const result = await solve(Or(...variables.flatMap(_ => _)));
		if (isModel(result)) {
			const getValue = (x: number, y: number) => 
				result.get(variables[x][y]).sexpr() === 'true';
			const cells = mapXY(width, height, getValue);
			return { cells };
		} else 
			return 'unsat';
	}
} 
