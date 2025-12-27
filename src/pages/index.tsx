import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { init } from "z3-solver";
import { testNonogram } from "../lib/solver";

const pageStyles = {
	color: "#232129",
	padding: 96,
	fontFamily: "-apple-system, Roboto, sans-serif, serif",
};

const runX = async () => {
	const { Context } = await init();
	const ctx = Context('main');

	const start = performance.now();

	const result = await testNonogram.solve(ctx);

	const end = performance.now();
	const elapsed = end - start;

	console.log(result);
	console.log(`Elapsed time: ${elapsed.toFixed(2)}ms`);
};

export default ((p) => {
	return (
		<main style={pageStyles}>
			<button onClick={runX}>Test</button>
		</main>
	);
}) as React.FC<PageProps>;

export const Head: HeadFC = () => <title>Home Page</title>;
