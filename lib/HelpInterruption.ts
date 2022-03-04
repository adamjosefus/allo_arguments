/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


export class HelpInterruption extends PrintableException {
    constructor(message: string) {
        console.log('\n\n');
        console.log(message);
        console.log('\n\n');

        super(message);
    }
}


/**
 * @deprecated Use `HelpInterruption` instead.
 */
export class HelpException extends HelpInterruption {
}
