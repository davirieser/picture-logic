import type { Context } from 'z3-solver';
import { Nonogram, type NonogramSolveMetrics } from './solver';

export type BenchmarkStatus = 'sat' | 'unsat' | 'unknown' | 'error';
export type BenchmarkMetric = keyof NonogramSolveMetrics;

export interface SolverBenchmarkCase {
	name: string;
	createPuzzle: () => Nonogram;
}

export interface SolverBenchmarkSolver {
	name: string;
	solve: (puzzle: Nonogram, context: Context<string>) => Promise<unknown>;
}

export interface SolverBenchmarkOptions {
	cases?: readonly SolverBenchmarkCase[];
	iterations?: number;
	warmupIterations?: number;
	contextFactory: (name: string) => Context<string>;
}

export interface SolverBenchmarkResult {
	solver: string;
	caseName: string;
	iterations: number;
	averageMs: number;
	minimumMs: number;
	maximumMs: number;
	statuses: Record<BenchmarkStatus, number>;
	metrics: Partial<Record<BenchmarkMetric, number>>;
	errors: string[];
}

const benchmarkMetrics = [
	'propagationMs',
	'encodingMs',
	'checkMs',
	'modelMs',
	'forcedCells',
	'propagationIterations',
	'automatonCacheHits',
	'automatonCacheMisses',
	'z3Variables',
	'z3Constraints'
] as const satisfies readonly BenchmarkMetric[];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function getBenchmarkStatus(result: unknown): BenchmarkStatus {
	if (result === 'unsat') return 'unsat';
	if (!isRecord(result)) return 'unknown';
	if (result.status === 'sat' || result.status === 'unsat' || result.status === 'unknown') {
		return result.status;
	}
	if ('cells' in result) return 'sat';
	return 'unknown';
}

function getMetrics(result: unknown) {
	if (!isRecord(result) || !isRecord(result.metrics)) return {};
	const metrics: Partial<Record<BenchmarkMetric, number>> = {};
	for (const metric of benchmarkMetrics) {
		const value = result.metrics[metric];
		if (typeof value === 'number' && Number.isFinite(value)) metrics[metric] = value;
	}
	return metrics;
}

function contextName(solverName: string, caseName: string, iteration: number) {
	const safeName = `${solverName}_${caseName}`.replace(/[^a-zA-Z0-9_]/g, '_');
	return `benchmark_${safeName}_${iteration}`;
}

function positiveInteger(value: number | undefined, fallback: number) {
	if (value === undefined) return fallback;
	if (!Number.isInteger(value) || value < 0) {
		throw new Error('Benchmark iteration counts must be non-negative integers');
	}
	return value;
}

export async function runSolverBenchmarks(
	solvers: readonly SolverBenchmarkSolver[],
	options: SolverBenchmarkOptions
): Promise<SolverBenchmarkResult[]> {
	const cases = options.cases ?? defaultSolverBenchmarkCases;
	const iterations = positiveInteger(options.iterations, 3);
	const warmupIterations = positiveInteger(options.warmupIterations, 1);
	if (iterations === 0) throw new Error('Benchmark iterations must be greater than zero');

	const results: SolverBenchmarkResult[] = [];

	for (const solver of solvers) {
		for (const benchmarkCase of cases) {
			const durations: number[] = [];
			const statuses: Record<BenchmarkStatus, number> = {
				sat: 0,
				unsat: 0,
				unknown: 0,
				error: 0
			};
			const metricTotals: Partial<Record<BenchmarkMetric, number>> = {};
			const errors: string[] = [];

			for (let iteration = 0; iteration < warmupIterations + iterations; iteration++) {
				const puzzle = benchmarkCase.createPuzzle();
				const context = options.contextFactory(
					contextName(solver.name, benchmarkCase.name, iteration)
				);
				const start = performance.now();
				let status: BenchmarkStatus;
				let metrics: Partial<Record<BenchmarkMetric, number>> = {};

				try {
					const result = await solver.solve(puzzle, context);
					status = getBenchmarkStatus(result);
					metrics = getMetrics(result);
				} catch (error) {
					status = 'error';
					errors.push(error instanceof Error ? error.message : String(error));
				}

				statuses[status]++;
				if (iteration < warmupIterations) continue;
				durations.push(performance.now() - start);
				for (const metric of benchmarkMetrics) {
					const value = metrics[metric];
					if (value !== undefined) metricTotals[metric] = (metricTotals[metric] ?? 0) + value;
				}
			}

			const metricAverages: Partial<Record<BenchmarkMetric, number>> = {};
			for (const metric of benchmarkMetrics) {
				const total = metricTotals[metric];
				if (total !== undefined) metricAverages[metric] = total / iterations;
			}
			results.push({
				solver: solver.name,
				caseName: benchmarkCase.name,
				iterations,
				averageMs: durations.reduce((sum, duration) => sum + duration, 0) / iterations,
				minimumMs: Math.min(...durations),
				maximumMs: Math.max(...durations),
				statuses,
				metrics: metricAverages,
				errors: [...new Set(errors)]
			});
		}
	}

	return results;
}

export function formatSolverBenchmarkResults(results: readonly SolverBenchmarkResult[]) {
	const header = [
		'Solver',
		'Case',
		'Average ms',
		'Min ms',
		'Max ms',
		'Status',
		'Propagation ms',
		'Encoding ms',
		'Check ms',
		'Z3 vars',
		'Z3 constraints'
	];
	const rows = results.map((result) => [
		result.solver,
		result.caseName,
		result.averageMs.toFixed(2),
		result.minimumMs.toFixed(2),
		result.maximumMs.toFixed(2),
		Object.entries(result.statuses)
			.filter(([, count]) => count > 0)
			.map(([status, count]) => `${status}:${count}`)
			.join(','),
		result.metrics.propagationMs?.toFixed(2) ?? '-',
		result.metrics.encodingMs?.toFixed(2) ?? '-',
		result.metrics.checkMs?.toFixed(2) ?? '-',
		result.metrics.z3Variables?.toFixed(0) ?? '-',
		result.metrics.z3Constraints?.toFixed(0) ?? '-'
	]);
	return [header, ...rows].map((row) => row.join('\t')).join('\n');
}

function squareCase(name: string, size: number, clues: number[]) {
	const lines = Array.from({ length: size }, () => [...clues]);
	return {
		name,
		createPuzzle: () => new Nonogram(lines, lines)
	};
}

export const defaultSolverBenchmarkCases: readonly SolverBenchmarkCase[] = [
	squareCase('empty-10', 10, []),
	squareCase('dense-15', 15, [15]),
	squareCase('ambiguous-10', 10, [1]),
	squareCase('fragmented-15', 15, [1, 1, 1]),
	squareCase('ambiguous-20', 20, [1])
];
