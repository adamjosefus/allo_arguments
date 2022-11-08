export const absurd = (value: never): never => {
    throw new Error(`Unknown type "${value}"`);
}
