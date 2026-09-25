export function mapXY<T>(width: number, height: number, fn: (x: number, y: number) => T): T[][] {
	return Array.from({ length: width }, (_, x) =>
		Array.from({ length: height }, (_, y) => fn(x, y))
	);
}

export function delay(timeMs: number) {
	return new Promise((resolve) => setTimeout(resolve, timeMs));
}

// https://en.wikipedia.org/wiki/Stars_and_bars_(combinatorics)
export function starsAndBars(balls: number, buckets: number) {
	const results: number[][] = [];

	function helper(remainingBalls: number, remainingBuckets: number, current: number[]) {
		// If this is the last bucket, it gets all remaining balls
		if (remainingBuckets === 1) {
			results.push([...current, remainingBalls]);
			return;
		}

		// The first and last bucket may be empty.
		const start = remainingBuckets === buckets ? 0 : 1,
			end = remainingBalls - (remainingBuckets - 2);
		for (let i = start; i <= end; i++)
			helper(remainingBalls - i, remainingBuckets - 1, [...current, i]);
	}

	helper(balls, buckets, []);
	return results;
}
