export function mapXY<T>(width: number, height: number, fn: (x: number, y: number) => T) : T[][] {
    return Array.from({ length: width }, (_, x) => 
        Array.from({ length: height }, (_, y) => fn(x, y)));
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
) {
    return {
        [`${utility}-${palette}-${step}`]: enabled,
        [`dark:${utility}-${palette}-${darkStep || 1000-step}`]: enabled,
    }
}
