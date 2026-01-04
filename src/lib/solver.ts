import type { Context, Bool } from 'z3-solver';
import { mapXY, starsAndBars, type Palette } from '$lib/util';

type NamedBool = Bool & { _name: string };

export interface NonogramCellPosition {
	x: number;
	y: number;
}
export interface NonogramCheckpoint {
	palette: Palette;
}
export interface NonogramGame {
	nonogram: Nonogram;
	move_history: (NonogramCellPosition | NonogramCheckpoint)[];
	timeMs?: number;
}

export interface Solvable<Result> {
	solve<Name extends string>(ctx: Context<Name>): Promise<Result | 'unsat'>;
}

export interface SolvedNonogram {
	cells: boolean[][];
}
export interface NonogramCell {
	palette?: Palette;
	filled: boolean;
	hint?: boolean;
	firstClick: boolean;
}
export class Nonogram implements Solvable<SolvedNonogram> {
	horizontal: number[][] = [];
	vertical: number[][] = [];

	constructor(top: number[][], left: number[][]) {
		this.horizontal = top;
		this.vertical = left;
	}

	async solve<Name extends string>(ctx: Context<Name>) {
		// TODO: Check if BitVec has better performance
		const { Bool, Solver } = ctx;

		const getName = (x: number, y: number) => `x${x}y${y}`;

		const width = this.horizontal.length,
			height = this.vertical.length;
		const variables = mapXY(width, height, (x, y) => {
			const name = getName(x, y);
			const variable = Bool.const(name);
			(variable as unknown as NamedBool)._name = name;
			return variable;
		});

		const clauses = this.getClauses(ctx, variables);

		const solver = new Solver();
		solver.add(clauses);
		if ((await solver.check()) !== 'sat') return 'unsat';

		const model = solver.model();

		const getValue = (x: number, y: number) => {
			try {
				return model.get(variables[x][y]).sexpr() === 'true';
			} catch {
				return false;
			}
		};
		const cells = mapXY(width, height, getValue);
		return { cells };
	}

	getClauses<Name extends string>(ctx: Context<Name>, variables: Bool<Name>[][]) {
		const { And, Or } = ctx;

		const createClauseForArr = (numbers: number[], variables: Bool<Name>[]) => {
			if (numbers.length <= 0) return And(...variables.map((b) => b.not()));

			// Minimum amount of cells required to fill in the given numbers.
			const numbersSum = numbers.reduce((acc, v) => acc + v, 0);
			const minCells = numbersSum + numbers.length - 1;

			if (variables.length < minCells) {
				// TODO: Better error message
				throw new Error('unsat');
			} else if (variables.length === minCells) {
				const result = numbers.reduce(
					(acc, n) => {
						const newClause = variables.slice(acc.idx, acc.idx + n);
						acc.clauses.push(...newClause);
						acc.idx += n;
						acc.clauses.push(variables[acc.idx].not());
						acc.idx += 1;
						return acc;
					},
					{ idx: 0, clauses: [] as Bool<Name>[] }
				);
				return And(...result.clauses);
			} else {
				const combinations = starsAndBars(variables.length - numbersSum, numbers.length + 1);

				const clauses = combinations.flatMap((c) => {
					const result = c.reduce(
						(acc, s, idx) => {
							const n = numbers[idx];
							const notQuantifiedCells = variables.slice(acc.idx, acc.idx + s);
							acc.clauses.push(...notQuantifiedCells.map((b) => b.not()));
							if (!n) return acc;

							acc.idx += s;
							const newClause = variables.slice(acc.idx, acc.idx + n);

							acc.clauses.push(...newClause);
							acc.idx += n;

							return acc;
						},
						{ idx: 0, clauses: [] as Bool<Name>[] }
					);

					return And(...result.clauses);
				});

				return Or(...clauses);
				// return And(Or(...clauses), exactlyOneClause);
			}
		};

		const horizontalClauses = this.horizontal
			.map((numbers, idx) => createClauseForArr(numbers, variables[idx]))
			.filter((v) => !!v);
		const verticalClauses = this.vertical
			.map((numbers, idx) =>
				createClauseForArr(
					numbers,
					variables.map((vs) => vs[idx])
				)
			)
			.filter((v) => !!v);

		const clauses = And(...horizontalClauses, ...verticalClauses);
		return clauses;
	}
}
