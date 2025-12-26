import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { init } from "z3-solver";

const pageStyles = {
	color: "#232129",
	padding: 96,
	fontFamily: "-apple-system, Roboto, sans-serif, serif",
};

const runX = async () => {
	console.log("Clicked");

	const { Context } = await init();
	const { Solver, Int, And } = Context('main');

	const x = Int.const('x');

	const solver = new Solver();
	solver.add(And(x.ge(0), x.le(9)));
	console.log(await solver.check());

	console.log("After");
};

export default ((p) => {
	return (
		<main style={pageStyles}>
			<button onClick={runX}>Test</button>
		</main>
	);
}) as React.FC<PageProps>;

export const Head: HeadFC = () => <title>Home Page</title>;
