import { Nonogram } from './solver';

export const MIN_GENERATED_SIZE = 10;
export const MAX_GENERATED_SIZE = 50;

const densityCandidates = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

export interface EntropyNonogram {
	size: number;
	nonogram: Nonogram;
	solution: boolean[][];
	fillRatio: number;
	entropy: number;
}

export function binaryEntropy(probability: number) {
	if (probability <= 0 || probability >= 1) return 0;
	return -probability * Math.log2(probability) - (1 - probability) * Math.log2(1 - probability);
}

function randomValue(random: () => number) {
	const value = random();
	if (!Number.isFinite(value) || value < 0 || value >= 1) {
		throw new RangeError('The random function must return a value in the range [0, 1)');
	}
	return value;
}

function randomInteger(min: number, max: number, random: () => number) {
	return min + Math.floor(randomValue(random) * (max - min + 1));
}

function pickDensity(random: () => number) {
	const weights = densityCandidates.map(binaryEntropy);
	const totalWeight = weights.reduce((total, weight) => total + weight, 0);
	let choice = randomValue(random) * totalWeight;

	for (let index = 0; index < densityCandidates.length; index++) {
		choice -= weights[index];
		if (choice < 0) return densityCandidates[index];
	}
	return densityCandidates[densityCandidates.length - 1];
}

function getRuns(line: readonly boolean[]) {
	const runs: number[] = [];
	let current = 0;

	for (const filled of line) {
		if (filled) {
			current++;
		} else if (current > 0) {
			runs.push(current);
			current = 0;
		}
	}

	if (current > 0) runs.push(current);
	return runs;
}

function getClues(solution: boolean[][]) {
	const size = solution.length;
	const horizontal = solution.map((column) => getRuns(column));
	const vertical = Array.from({ length: size }, (_, row) =>
		getRuns(solution.map((column) => column[row]))
	);
	return { horizontal, vertical };
}

export function generateEntropyNonogram(random: () => number = Math.random): EntropyNonogram {
	const size = randomInteger(MIN_GENERATED_SIZE, MAX_GENERATED_SIZE, random);
	const density = pickDensity(random);
	const solution = Array.from({ length: size }, () =>
		Array.from({ length: size }, () => randomValue(random) < density)
	);
	const { horizontal, vertical } = getClues(solution);
	const filledCells = solution.reduce((total, column) => total + column.filter(Boolean).length, 0);
	const fillRatio = filledCells / (size * size);

	return {
		size,
		nonogram: new Nonogram(horizontal, vertical),
		solution,
		fillRatio,
		entropy: binaryEntropy(fillRatio)
	};
}
