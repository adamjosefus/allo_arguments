import { Exception } from "./Exception.ts";

export class ValueException extends Exception {
    constructor(message: string) {
        console.log('\n\n');
        message.split('\n').map(l => {
            console.log(`>> %c ${l}`, 'color: #ff4646; font-weight: bold;');
        });
        console.log('\n\n');

        super(message);
    }
}