/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


export class ExpectedException extends PrintableException {
    constructor(message: string) {
        console.log('\n');
        message.split('\n').map(l => {
            console.log(`>> %c ${l}`, 'color: #ff4646; font-weight: bold;');
        });
        console.log('\n');

        super(message);

        Deno.exit(1);
    }
}


/**
 * @deprecated Use `ExpectedException` instead.
 */
export class ValueException extends ExpectedException {
}
