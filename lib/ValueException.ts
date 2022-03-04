/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


export class ValueException extends PrintableException {
    constructor(message: string, exitSignal?: number) {
        console.log('\n\n');
        message.split('\n').map(l => {
            console.log(`>> %c ${l}`, 'color: #ff4646; font-weight: bold;');
        });
        console.log('\n\n');

        super(message);
    }
}
