export function mapXY<T>(width: number, height: number, fn: (x: number, y: number) => T) : T[][] {
    return Array.from({ length: width }, (_, x) => 
        Array.from({ length: height }, (_, y) => fn(x, y)));
}

export function delay(timeMs: number) {
    return new Promise((resolve) => setTimeout(resolve, timeMs))
}

export const PALETTES = ["red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "slate", "gray", "zinc", "neutral", "stone"] as const;
export type Palette = typeof PALETTES[number];
export type Utility = "bg" | "text" | "decoration" | "border" | "outline" | "shadow" | "inset-shadow" | "ring" | "inset-ring" | "accent" | "caret" | "fill" | "stroke";
export type PaletteStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export function getPalleteClasses(
    palette: Palette, 
    utility: Utility, 
    step: PaletteStep, 
    darkStep?: PaletteStep,
    enabled: boolean = true,
    pseudoClass: string | undefined = undefined, 
) {
    const pseudoClassSelector = pseudoClass ? `${pseudoClass}:` : "";
    return {
        [`${pseudoClassSelector}${utility}-${palette}-${step}`]: enabled,
        [`dark:${pseudoClassSelector}${utility}-${palette}-${darkStep || 1000-step}`]: enabled,
    }
}

// https://en.wikipedia.org/wiki/Stars_and_bars_(combinatorics)
export function starsAndBars(balls: number, buckets: number) {
    const results : number[][] = [];

    function helper(remainingBalls: number, remainingBuckets: number, current: number[]) {
        // If this is the last bucket, it gets all remaining balls
        if (remainingBuckets === 1) {
            results.push([...current, remainingBalls]);
            return;
        }

        // The fisrt and last bucket may be empty.
        const start = remainingBuckets === buckets ? 0 : 1,
            end = remainingBalls - (remainingBuckets - 2);
        for (let i = start; i <= end; i++)
            helper(remainingBalls - i, remainingBuckets - 1, [...current, i]);
    }

    helper(balls, buckets, []);
    return results;
}