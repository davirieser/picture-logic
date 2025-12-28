import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { init } from "z3-solver";
import { Nonogram } from "../lib/solver";
import NonogramComponent from "../components/Nonogram";
import { mapXY } from "../lib/util";

const IndexPage = ((p: PageProps) => {
	const [nonogram, setNonogram] = React.useState(
		new Nonogram([[1,2,3], [1,2], [3], []], [[1,2,3], [1,2], [2,3]])
	);
	const [cells, setCells] = React.useState(() => mapXY(
		nonogram.right.length, 
		nonogram.bottom.length, 
		_ => false
	));

	const runX = async () => {
		const { Context } = await init();
		const ctx = Context('main');

		const start = performance.now();

		const result = await nonogram.solve(ctx);
		if (result !== 'unsat')
		{
			console.log(result.cells);
			setCells(result.cells);
		}

		const end = performance.now();
		const elapsed = end - start;

		console.log(`Elapsed time: ${elapsed.toFixed(2)}ms`);
	};

	const cellClicked = async (x: number, y: number) => {
		setCells((cells) => mapXY(
			nonogram.right.length, 
			nonogram.bottom.length, 
			(_x, _y) => cells[_x][_y] = cells[_x][_y] !== (x === _x && y === _y)
		));
	}

	return (
		<main>
			<button onClick={runX}>Test</button>
			<NonogramComponent 
				input={nonogram} 
				filled={{ cells }} 
				cellClicked={cellClicked} />
		</main>
	);
});

export default IndexPage;

export const Head: HeadFC = () => <title>Home Page</title>;
