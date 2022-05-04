/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


export class InfoInterruption extends PrintableException {
    constructor(message: string) {
        console.log('\n\n');
        console.log(message);
        console.log('\n\n');

        super(message);
        
        Deno.exit(0);
    }
}


/**
 * @deprecated Use `InfoInterruption` instead.
 */
export class HelpInterruption extends InfoInterruption {
}
