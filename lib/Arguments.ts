import { parse } from "https://deno.land/std/flags/mod.ts";


// deno-lint-ignore-file
type InputProcessor<V> = {
    (value: any): V;
}


export class Arguments {

    // deno-lint-ignore no-explicit-any
    private inputs: any;


    private list: {
        names: string[],
        description: string,
        processor: InputProcessor<unknown>
    }[] = [];


    constructor() {
        this.inputs = parse(Deno.args);
    }


    expect<V>(names: string | string[], description: string, processor: InputProcessor<V>) {
        if (typeof names === 'string') names = [names];

        const registred = this.list.reduce((acc, l) => {
            acc.push(...l.names)

            return acc;
        }, ['help']);

        names.forEach(name => {
            if (registred.includes(name)) {
                throw new Error(`Argument "${name}" is already exist.`);
            }
        });

        this.list.push({
            names,
            description,
            processor
        })
    }


    getRaw(...names: string[]) {
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            if (this.inputs[name] !== undefined) return this.inputs[name];
        }

        return undefined;
    }


    get<V>(name: string): V {
        const item = this.list.find(l => l.names.find(n => n === name));

        if (!item) throw new Error(`Argument "${name}" is not found.`);

        const input = this.getRaw(...item.names);
        return item.processor(input) as V;
    }


    hasHelp(): boolean {
        return this.getRaw('help') === true;
    }


    getHelpMessage(): string {
        return this.list.map(l => {
            const names = l.names.map(n => `--${n}`).join(', ')

            return [
                '',
                `  ${names}`,
                `        ${l.description}`,
                '',
            ].join('\n');
        }).join('\n');
    }
}