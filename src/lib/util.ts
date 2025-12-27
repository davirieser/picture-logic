export function mapXY<T>(width: number, height: number, fn: (x: number, y: number) => T) : T[][] {
    return Array.from({ length: width }, (_, x) => 
        Array.from({ length: height }, (_, y) => fn(x, y)));
}
