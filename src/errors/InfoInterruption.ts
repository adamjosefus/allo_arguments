/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


export class InfoInterruption extends PrintableException {
    constructor(message: string, callback?: () => void) {
        console.log('\n');
        console.log(message);
        console.log('\n');

        super(message, callback);
    }
}
