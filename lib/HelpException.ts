/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Exception } from "./Exception.ts";


export class HelpException extends Exception {
    constructor(message: string) {
        console.log('\n\n');
        console.log(message);
        console.log('\n\n');

        super(message);
    }
}
