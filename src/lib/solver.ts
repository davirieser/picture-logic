import type { Bool, Context } from 'z3-solver';
import { mapXY } from '$lib/util';

type CellState = -1 | 0 | 1;

interface LineAutomaton {
	length: number;
	stateCount: number;
	initialState: number;
	accepting: Uint8Array;
	zeroTransitions: Int32Array;
	oneTransitions: Int32Array;
}

interface LineAnalysis {
	status: 'ok' | 'unsat';
	forced: CellState[];
}

interface PropagationResult {
	status: 'sat' | 'unsat';
	values: CellState[][];
	forcedCells: number;
	iterations: number;
}

const automatonCache = new Map<string, LineAutomaton>();

function now() {
	return globalThis.performance?.now() ?? Date.now();
}

function clueKey(length: number, clues: readonly number[]) {
	return `${length}:${clues.join(',')}`;
}

function validateClues(clues: readonly number[], axis: string) {
	for (const clue of clues) {
		if (!Number.isInteger(clue) || clue <= 0) {
			throw new NonogramInputError(`${axis} clues must contain positive integers`);
		}
	}
}

function getAutomaton(length: number, clues: readonly number[]) {
	const key = clueKey(length, clues);
	const cached = automatonCache.get(key);
	if (cached) return { automaton: cached, cacheHit: true };

	const starts: number[] = [];
	const runs: number[][] = [];
	let stateCount = 0;

	for (const clue of clues) {
		starts.push(stateCount++);
		const runStates = [];
		for (let offset = 1; offset <= clue; offset++) runStates.push(stateCount++);
		runs.push(runStates);
	}

	const doneState = stateCount++;
	const zeroTransitions = new Int32Array(stateCount).fill(-1);
	const oneTransitions = new Int32Array(stateCount).fill(-1);
	const accepting = new Uint8Array(stateCount);

	if (clues.length === 0) {
		zeroTransitions[doneState] = doneState;
		accepting[doneState] = 1;
	} else {
		for (let runIndex = 0; runIndex < clues.length; runIndex++) {
			const runStates = runs[runIndex];
			const startState = starts[runIndex];
			zeroTransitions[startState] = startState;
			oneTransitions[startState] = runStates[0];

			for (let offset = 1; offset <= runStates.length; offset++) {
				const state = runStates[offset - 1];
				if (offset < runStates.length) {
					oneTransitions[state] = runStates[offset];
				} else if (runIndex + 1 < clues.length) {
					zeroTransitions[state] = starts[runIndex + 1];
				} else {
					zeroTransitions[state] = doneState;
					accepting[state] = 1;
				}
			}
		}
		accepting[doneState] = 1;
		zeroTransitions[doneState] = doneState;
	}

	const automaton: LineAutomaton = {
		length,
		stateCount,
		initialState: clues.length === 0 ? doneState : starts[0],
		accepting,
		zeroTransitions,
		oneTransitions
	};
	automatonCache.set(key, automaton);
	return { automaton, cacheHit: false };
}

function analyzeLine(automaton: LineAutomaton, values: readonly CellState[]): LineAnalysis {
	const { length, stateCount } = automaton;
	const forward = Array.from({ length: length + 1 }, () => new Uint8Array(stateCount));
	const backward = Array.from({ length: length + 1 }, () => new Uint8Array(stateCount));
	forward[0][automaton.initialState] = 1;

	for (let position = 0; position < length; position++) {
		for (let state = 0; state < stateCount; state++) {
			if (!forward[position][state]) continue;
			if (values[position] !== 1) {
				const target = automaton.zeroTransitions[state];
				if (target >= 0) forward[position + 1][target] = 1;
			}
			if (values[position] !== 0) {
				const target = automaton.oneTransitions[state];
				if (target >= 0) forward[position + 1][target] = 1;
			}
		}
	}

	for (let state = 0; state < stateCount; state++)
		backward[length][state] = automaton.accepting[state];
	for (let position = length - 1; position >= 0; position--) {
		for (let state = 0; state < stateCount; state++) {
			const zeroTarget = automaton.zeroTransitions[state];
			const oneTarget = automaton.oneTransitions[state];
			backward[position][state] = Number(
				(zeroTarget >= 0 && backward[position + 1][zeroTarget]) ||
					(oneTarget >= 0 && backward[position + 1][oneTarget])
			);
		}
	}

	if (!backward[0][automaton.initialState]) {
		return { status: 'unsat', forced: [] };
	}

	const forced = values.slice();
	for (let position = 0; position < length; position++) {
		let canBeZero = false;
		let canBeOne = false;
		for (let state = 0; state < stateCount; state++) {
			if (!forward[position][state]) continue;
			const zeroTarget = automaton.zeroTransitions[state];
			const oneTarget = automaton.oneTransitions[state];
			if (zeroTarget >= 0 && backward[position + 1][zeroTarget]) canBeZero = true;
			if (oneTarget >= 0 && backward[position + 1][oneTarget]) canBeOne = true;
		}
		if (!canBeZero && !canBeOne) return { status: 'unsat', forced: [] };
		if (!canBeZero) forced[position] = 1;
		if (!canBeOne) forced[position] = 0;
	}

	return { status: 'ok', forced };
}

function allKnown(values: CellState[][]) {
	return values.every((column) => column.every((value) => value !== -1));
}

function getRuns(values: readonly boolean[]) {
	const runs: number[] = [];
	let current = 0;
	for (const value of values) {
		if (value) current++;
		else if (current > 0) {
			runs.push(current);
			current = 0;
		}
	}
	if (current > 0) runs.push(current);
	return runs;
}

function sameNumbers(left: readonly number[], right: readonly number[]) {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}

export class NonogramInputError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NonogramInputError';
	}
}

export class NonogramUnknownError extends Error {
	constructor() {
		super('Z3 returned an unknown result');
		this.name = 'NonogramUnknownError';
	}
}

export interface NonogramCellPosition {
	x: number;
	y: number;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NonogramCheckpoint {
	// TODO: Add color
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
export interface NonogramSolveMetrics {
	propagationMs: number;
	encodingMs: number;
	checkMs: number;
	modelMs: number;
	forcedCells: number;
	propagationIterations: number;
	automatonCacheHits: number;
	automatonCacheMisses: number;
	z3Variables: number;
	z3Constraints: number;
}
export type NonogramSolveResult =
	| { status: 'sat'; cells: boolean[][]; metrics: NonogramSolveMetrics }
	| { status: 'unsat'; metrics: NonogramSolveMetrics }
	| { status: 'unknown'; metrics: NonogramSolveMetrics };
export interface NonogramCell {
	// TODO: Add color
	filled: boolean;
	hint?: boolean;
	firstClick: boolean;
}
export class Nonogram implements Solvable<SolvedNonogram> {
	horizontal: number[][] = [];
	vertical: number[][] = [];

	constructor(top: number[][], left: number[][]) {
		top.forEach((clues, index) => validateClues(clues, `horizontal[${index}]`));
		left.forEach((clues, index) => validateClues(clues, `vertical[${index}]`));
		this.horizontal = top.map((clues) => [...clues]);
		this.vertical = left.map((clues) => [...clues]);
	}

	async solve<Name extends string>(ctx: Context<Name>): Promise<SolvedNonogram | 'unsat'> {
		const result = await this.solveDetailed(ctx);
		if (result.status === 'sat') return { cells: result.cells };
		if (result.status === 'unsat') return 'unsat';
		throw new NonogramUnknownError();
	}

	async solveDetailed<Name extends string>(ctx: Context<Name>): Promise<NonogramSolveResult> {
		const width = this.horizontal.length;
		const height = this.vertical.length;
		const metrics: NonogramSolveMetrics = {
			propagationMs: 0,
			encodingMs: 0,
			checkMs: 0,
			modelMs: 0,
			forcedCells: 0,
			propagationIterations: 0,
			automatonCacheHits: 0,
			automatonCacheMisses: 0,
			z3Variables: 0,
			z3Constraints: 0
		};
		const values = mapXY(width, height, () => -1 as CellState);

		const propagationStart = now();
		const propagation = this.propagate(values, metrics);
		metrics.propagationMs = now() - propagationStart;
		if (propagation.status === 'unsat') return { status: 'unsat', metrics };

		if (allKnown(propagation.values)) {
			const cells = mapXY(width, height, (x, y) => propagation.values[x][y] === 1);
			this.validateCells(cells);
			return { status: 'sat', cells, metrics };
		}

		const { Bool, Solver } = ctx;
		const variables = mapXY(width, height, (x, y) => Bool.const(`x${x}y${y}`));
		const encodingStart = now();
		const encoded = this.buildClauses(ctx, variables, propagation.values);
		metrics.encodingMs = now() - encodingStart;
		metrics.z3Variables = encoded.variableCount;
		metrics.z3Constraints = encoded.constraintCount;
		metrics.automatonCacheHits += encoded.cacheHits;
		metrics.automatonCacheMisses += encoded.cacheMisses;

		const solver = new Solver();
		solver.add(encoded.formula);
		const checkStart = now();
		const status = await solver.check();
		metrics.checkMs = now() - checkStart;
		if (status === 'unsat') return { status: 'unsat', metrics };
		if (status !== 'sat') return { status: 'unknown', metrics };

		const modelStart = now();
		const model = solver.model();
		const cells = mapXY(
			width,
			height,
			(x, y) => model.eval(variables[x][y], true).sexpr() === 'true'
		);
		metrics.modelMs = now() - modelStart;
		this.validateCells(cells);
		return { status: 'sat', cells, metrics };
	}

	getClauses<Name extends string>(ctx: Context<Name>, variables: Bool<Name>[][]) {
		const values = mapXY(variables.length, this.vertical.length, () => -1 as CellState);
		return this.buildClauses(ctx, variables, values).formula;
	}

	private propagate(values: CellState[][], metrics: NonogramSolveMetrics): PropagationResult {
		const width = this.horizontal.length;
		const height = this.vertical.length;
		const pendingRows = new Uint8Array(height);
		const pendingColumns = new Uint8Array(width);
		const queue: { orientation: 'row' | 'column'; index: number }[] = [];
		const enqueueRow = (index: number) => {
			if (!pendingRows[index]) {
				pendingRows[index] = 1;
				queue.push({ orientation: 'row', index });
			}
		};
		const enqueueColumn = (index: number) => {
			if (!pendingColumns[index]) {
				pendingColumns[index] = 1;
				queue.push({ orientation: 'column', index });
			}
		};
		for (let y = 0; y < height; y++) enqueueRow(y);
		for (let x = 0; x < width; x++) enqueueColumn(x);

		let head = 0;
		let forcedCells = 0;
		while (head < queue.length) {
			const item = queue[head++];
			if (item.orientation === 'row') pendingRows[item.index] = 0;
			else pendingColumns[item.index] = 0;
			metrics.propagationIterations++;

			const length = item.orientation === 'row' ? width : height;
			const clues =
				item.orientation === 'row' ? this.vertical[item.index] : this.horizontal[item.index];
			const lineValues = Array.from({ length }, (_, position) =>
				item.orientation === 'row' ? values[position][item.index] : values[item.index][position]
			);
			const cached = getAutomaton(length, clues);
			if (cached.cacheHit) metrics.automatonCacheHits++;
			else metrics.automatonCacheMisses++;
			const analysis = analyzeLine(cached.automaton, lineValues);
			if (analysis.status === 'unsat') {
				return { status: 'unsat', values, forcedCells, iterations: metrics.propagationIterations };
			}

			for (let position = 0; position < length; position++) {
				const next = analysis.forced[position];
				if (next === -1) continue;
				const x = item.orientation === 'row' ? position : item.index;
				const y = item.orientation === 'row' ? item.index : position;
				if (values[x][y] !== -1 && values[x][y] !== next) {
					return {
						status: 'unsat',
						values,
						forcedCells,
						iterations: metrics.propagationIterations
					};
				}
				if (values[x][y] !== -1) continue;
				values[x][y] = next;
				forcedCells++;
				if (item.orientation === 'row') enqueueColumn(x);
				else enqueueRow(y);
			}
		}

		metrics.forcedCells = forcedCells;
		return { status: 'sat', values, forcedCells, iterations: metrics.propagationIterations };
	}

	private buildClauses<Name extends string>(
		ctx: Context<Name>,
		variables: Bool<Name>[][],
		values: CellState[][]
	) {
		const { And, Or, Bool } = ctx;
		const constraints: Bool<Name>[] = [];
		let auxiliaryVariables = 0;
		let cacheHits = 0;
		let cacheMisses = 0;

		for (let x = 0; x < variables.length; x++) {
			for (let y = 0; y < variables[x].length; y++) {
				if (values[x][y] === 0) constraints.push(variables[x][y].not());
				if (values[x][y] === 1) constraints.push(variables[x][y]);
			}
		}

		const equivalent = (left: Bool<Name>, right: Bool<Name>) =>
			And(Or(left.not(), right), Or(right.not(), left));
		const encodeLine = (
			line: Bool<Name>[],
			known: CellState[],
			clues: number[],
			prefix: string
		) => {
			if (known.every((value) => value !== -1)) return;
			const cached = getAutomaton(line.length, clues);
			if (cached.cacheHit) cacheHits++;
			else cacheMisses++;
			const automaton = cached.automaton;
			const states = Array.from({ length: line.length + 1 }, (_, position) =>
				Array.from({ length: automaton.stateCount }, (_, state) =>
					Bool.const(`state_${prefix}_${position}_${state}`)
				)
			);
			auxiliaryVariables += (line.length + 1) * automaton.stateCount;

			constraints.push(states[0][automaton.initialState]);
			for (let state = 0; state < automaton.stateCount; state++) {
				if (state !== automaton.initialState) constraints.push(states[0][state].not());
			}

			for (let position = 0; position < line.length; position++) {
				for (let target = 0; target < automaton.stateCount; target++) {
					const incoming: Bool<Name>[] = [];
					for (let source = 0; source < automaton.stateCount; source++) {
						if (automaton.zeroTransitions[source] === target) {
							incoming.push(And(states[position][source], line[position].not()));
						}
						if (automaton.oneTransitions[source] === target) {
							incoming.push(And(states[position][source], line[position]));
						}
					}
					const incomingExpression = incoming.length ? Or(...incoming) : Bool.val(false);
					constraints.push(equivalent(states[position + 1][target], incomingExpression));
				}
			}

			const acceptingStates = [];
			for (let state = 0; state < automaton.stateCount; state++) {
				if (automaton.accepting[state]) acceptingStates.push(states[line.length][state]);
			}
			constraints.push(Or(...acceptingStates));
		};

		for (let y = 0; y < this.vertical.length; y++) {
			encodeLine(
				variables.map((column) => column[y]),
				values.map((column) => column[y]),
				this.vertical[y],
				`row_${y}`
			);
		}
		for (let x = 0; x < this.horizontal.length; x++) {
			encodeLine(variables[x], values[x], this.horizontal[x], `column_${x}`);
		}

		return {
			formula: constraints.length ? And(...constraints) : Bool.val(true),
			variableCount: variables.length * (variables[0]?.length ?? 0) + auxiliaryVariables,
			constraintCount: constraints.length,
			cacheHits,
			cacheMisses
		};
	}

	private validateCells(cells: boolean[][]) {
		for (let y = 0; y < this.vertical.length; y++) {
			const row = cells.map((column) => column[y]);
			if (!sameNumbers(getRuns(row), this.vertical[y])) {
				throw new Error(`Invalid row model at index ${y}`);
			}
		}
		for (let x = 0; x < this.horizontal.length; x++) {
			if (!sameNumbers(getRuns(cells[x]), this.horizontal[x])) {
				throw new Error(`Invalid column model at index ${x}`);
			}
		}
	}
}
