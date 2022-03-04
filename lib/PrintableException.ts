/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

export abstract class PrintableException extends Error {
}


/**
 * @deprecated Use `PrintableException` instead.
 */
export abstract class Exception extends PrintableException {
}
