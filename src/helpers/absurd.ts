/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

export const absurd = (value: never): never => {
    throw new Error(`Unknown type "${value}"`);
}
