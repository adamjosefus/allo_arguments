/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

export abstract class PrintableException extends Error {
    constructor(message: string, callback: (() => void) | undefined) {
        if (callback) callback()

        super(message);
    }
}


export class InfoInterruption extends PrintableException {
    constructor(message: string, callback?: () => void) {
        console.log('\n');
        console.log(message);
        console.log('\n');

        super(message, callback);
    }
}

export class ExpectedException extends PrintableException {
    constructor(message: string, callback?: () => void) {
        console.log('\n');
        message.split('\n').map(l => {
            console.log(`>> %c ${l}`, 'color: #ff4646; font-weight: bold;');
        });
        console.log('\n');

        super(message, callback);
    }
}
