/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { PrintableException } from "./PrintableException.ts";


type OptionsType = Partial<{
    exitSignal: number,
}>;


export class ValueException extends PrintableException {
    constructor(message: string, options?: OptionsType) {
        console.log('\n\n');
        message.split('\n').map(l => {
            console.log(`>> %c ${l}`, 'color: #ff4646; font-weight: bold;');
        });
        console.log('\n\n');

        super(message);

        if (options?.exitSignal !== undefined) {
            Deno.exit(options?.exitSignal);
        }
    }
}
