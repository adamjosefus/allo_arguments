/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

export abstract class PrintableException extends Error {
    constructor(message: string, callback: (() => void) | undefined) {
        if (callback) callback()

        super(message);
    }
}
