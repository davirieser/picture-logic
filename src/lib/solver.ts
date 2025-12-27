import { Context } from 'z3-solver';
import { mapXY } from './util';

export interface Solvable<Result> {
	solve<Name extends string>(ctx: Context<Name>): Promise<Result | 'unsat'>,
}
export interface SolvedNonogram {
	cells: boolean[][],
}
export interface Nonogram extends Solvable<SolvedNonogram> {
	top: number[][],
	left: number[][],
} 
export const testNonogram : Nonogram = {
	top: [],
	left: [],
	solve: async (ctx) => {
		const { Bool, And, Or, solve, isModel } = ctx;

		const getName = (x: number, y: number) => `x${x}y${y}`;

		const width = 20, height = 15;
		const variables = mapXY(width, height, (x, y) => Bool.const(getName(x, y)));

		const result = await solve(Or(...variables.flatMap(_ => _)));
		if (isModel(result)) {
			const cells = mapXY(width, height, (x, y) => result.get(variables[x][y]).sexpr() === 'true')
			return { cells };
		} else 
			return 'unsat';
	}
}
