import * as React from "react";
import { Nonogram, SolvedNonogram } from "../lib/solver";

export type CellClickedHandler = (x: number, y: number) => Promise<void>;
export interface NonogramInput {
	input: Nonogram,
	filled: SolvedNonogram,
    cellClicked: CellClickedHandler,
};

type ME = React.MouseEvent<HTMLElement, MouseEvent>;
type CellProps = { 
    x: number, 
    y: number, 
    filled: boolean[][],
    cellClicked: CellClickedHandler
};

const isPrimaryButtonClicked = (event: ME) => (event.buttons & 1) === 1;
function createCellMouseEnterHandler({ x, y, cellClicked }: CellProps) {
    return async (event: ME) => {
        if (!isPrimaryButtonClicked(event))
            return;

        if (cellClicked)
            await cellClicked(x, y);
    }
}

function Cell(props: CellProps) {
    const value = props.filled[props.x][props.y];
    return (
        <td
            style={{
                background: value ? "black" : "gray"
            }}
            onMouseEnter={createCellMouseEnterHandler(props)}
            onMouseDown={createCellMouseEnterHandler(props)}
        >
            {value}
        </td>
    )
}

export default (({ filled, input, cellClicked }: NonogramInput) => {
	const getHighestStack = (n: number[][]) =>
		Math.max(...n.map((s) => s.length));
	const highestStackBottom = getHighestStack(input.bottom),
		highestStackRight = getHighestStack(input.right);

	return (
		<table>
            <tbody>
                {Array.from({ length: highestStackBottom }, (_, i) => (
                    <tr>
                        {<td key={`e${i}`} colSpan={highestStackRight}></td>}
                        {input.bottom.map((ns, idx) => {
                            // TODO: If array is empty, insert content placeholder to ensure width
                            const offset = highestStackBottom - ns.length;
                            const n = offset <= i ? ns[i - offset] : null;
                            return <td key={`t${i}.${idx}`}>{n}</td>;
                        })}
                    </tr>
                ))}

                {Array.from({ length: input.right.length }, (_, y) => (
                    <tr>
                        {Array.from(
                            { length: highestStackRight - input.right[y].length },
                            (_, idx) => (
                                <td key={`e${y}.${idx}`}></td>
                            ),
                        )}
                        {
                            // TODO: If array is empty, insert content placeholder to ensure height
                            input.right[y].map((n) => {
                                return <td>{n}</td>;
                            })
                        }
                        {Array.from({ length: input.bottom.length }, (_, x) => 
                            <Cell x={y} y={x} filled={filled.cells} cellClicked={cellClicked} />
                        )}
                    </tr>
                ))}
            </tbody>
		</table>
	);
});
