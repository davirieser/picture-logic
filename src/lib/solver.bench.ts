import { afterAll, beforeAll, bench, describe } from 'vitest';
import { init, type Context } from 'z3-solver';
import {
	defaultSolverBenchmarkCases,
	formatSolverBenchmarkResults,
	runSolverBenchmarks,
	type SolverBenchmarkResult,
	type SolverBenchmarkSolver
} from './solver-benchmark';

const solvers: readonly SolverBenchmarkSolver[] = [
	{
		name: 'boolean-automaton',
		solve: (puzzle, context) => puzzle.solveDetailed(context)
	}
];

let contextFactory: (name: string) => Context<string>;
const results = new Map<string, SolverBenchmarkResult>();

beforeAll(async () => {
	const z3 = await init();
	contextFactory = (name) => z3.Context(name);
});

afterAll(() => {
	if (results.size > 0) console.log(`\n${formatSolverBenchmarkResults([...results.values()])}`);
});

describe('solver benchmarks', () => {
	for (const solver of solvers) {
		for (const benchmarkCase of defaultSolverBenchmarkCases) {
			bench(
				`${solver.name}/${benchmarkCase.name}`,
				async () => {
					const [result] = await runSolverBenchmarks([solver], {
						cases: [benchmarkCase],
						iterations: 1,
						warmupIterations: 0,
						contextFactory
					});
					if (!result) throw new Error('Benchmark did not produce a result');
					results.set(`${result.solver}/${result.caseName}`, result);
					if (result.errors.length > 0) throw new Error(result.errors.join('; '));
				},
				{ time: 0, iterations: 1, warmupTime: 0, warmupIterations: 0 }
			);
		}
	}
});
