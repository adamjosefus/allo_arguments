/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


export class InfoInterruption extends PrintableException {
    constructor(message: string) {
        console.log('\n');
        console.log(message);
        console.log('\n');

        super(message);
    }
}
