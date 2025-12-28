import { Context } from 'z3-solver';
import { mapXY } from './util';

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
	bottom: number[][] = [];
	right: number[][] = [];

	constructor(top: number[][], left: number[][]) {
		this.bottom = top;
		this.right = left;
	}

	async solve<Name extends string>(ctx: Context<Name>) {
		const { Bool, And, Or, solve, isModel } = ctx;

		const getName = (x: number, y: number) => `x${x}y${y}`;

		const width = this.right.length, height = this.bottom.length;
		const variables = mapXY(width, height, (x, y) => Bool.const(getName(x, y)));

		const result = await solve(And(...variables.flatMap(_ => _)));
		if (isModel(result)) {
			const getValue = (x: number, y: number) => 
				result.get(variables[x][y]).sexpr() === 'true';
			const cells = mapXY(width, height, getValue);
			return { cells };
		} else 
			return 'unsat';
	}
} 
