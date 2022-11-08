/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { absurd } from "./helpers/absurd.ts";
import { Command, Flag, parse } from "./model/parse.ts";
import { primary, secondary, inspect } from "./helpers/colors.ts";
import { PrintableException } from "./PrintableException.ts";
import { InfoInterruption } from "./InfoInterruption.ts";


interface Argument {
    names: [long: string] | [long: string, short: string],
    value: string | boolean,
}


type KeyByValue<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];


interface TypeMap {
    'string': string,
    'number': number,
    'boolean': boolean,
}

export interface Declaration<T> {
    name: T extends boolean ? [long: string, short: string] | [name: string] | string : [name: string] | string,
    default?: {
        value: T,
        mode?: 'postConversion',
    } | {
        value: string | boolean,
        mode: 'preConversion',
    },
    type?: KeyByValue<TypeMap, T> extends never ? Converter<T> : KeyByValue<TypeMap, T>,
    validator?: Validator<T>,
    description: string,
    excludeFromHelp?: boolean,
}


export type Converter<T> = {
    (value: undefined | string | boolean): T;
}

export type Validator<T> = {
    (value: T): boolean;
}



const normalizeDeclarations = (declarations: Declaration<unknown>[]) => {
    const entries = declarations.map(dec => {
        const [longName, shortName] = [dec.name].flat() as [string, string?];

        const description = dec.description?.trim().split('\n') ?? undefined

        const convertor = (typeOrConvertor => {
            if (typeof typeOrConvertor === 'function') return typeOrConvertor;

            switch (typeOrConvertor) {
                case 'string': return (v: unknown) => `${v}`;
                case 'number': return (v: unknown) => Number(v);
                case 'boolean': return (v: unknown) => {
                    if (v === undefined) return false;
                    if (v === null) return false;
                    if (v === false) return false;

                    if (v === true) return true;
                    if (`${v}`.toLowerCase().trim() === 'true') return true;
                    if (`${v}`.toLowerCase().trim() === '1') return true;

                    return true;
                }
            }

            return absurd(typeOrConvertor);
        })(dec.type ?? 'string');

        return {
            longName,
            shortName,
            description,
            default: dec.default,
            convertor,
            validator: dec.validator,
            excludeFromHelp: dec.excludeFromHelp ?? false,
        }
    }).map(dec => [dec.longName, dec] as [string, typeof dec]);


    return new Map(entries);
}


export class Arguments {
    #declarations: ReturnType<typeof normalizeDeclarations>;
    #desciprion: string | null = null;

    #rawFlags: (Command | Flag)[];

    constructor(...declarations: Declaration<unknown>[]) {
        this.#declarations = normalizeDeclarations(declarations)
        this.#rawFlags = parse(Deno.args);
    }


    #getRawFlag(primary: string, ...secondaries: (string | undefined)[]) {
        const names = [primary, ...secondaries]
            .filter(n => n !== undefined)
            .map(n => `${n}`)
            .map(n => n.toLowerCase().trim())
            .filter(n => n !== '');

        const flag = this.#rawFlags.filter(r => r._tag === 'Flag') // Filter out commands
            .map(r => r as Flag) // Hack to make the type checker happy
            .find(r => names.includes(r.name.toLowerCase().trim()));

        return flag;
    }


    get<T>(name: string): T {
        const dec = this.#declarations.get(name);

        if (!dec) throw new Error(`Argument "${name}" is not declared.`);

        const value = this.#getRawFlag(dec.longName, dec.shortName);
        return dec.convertor(value ?? dec.default) as T;
    }


    shouldHelp(): boolean {
        return !!this.#getRawFlag('help');
    }


    setDescription(description: string) {
        this.#desciprion = description;
    }


    keepProcessAlive(message = 'Press Enter key to exit the process...') {
        globalThis.addEventListener('unload', () => {
            prompt(message);
        }, { once: true });
    }


    getHelpMessage(): string {
        const tab = (n = 1) => ' '.repeat(Math.max(n, 1) * 2);

        const declarations = Array.from(this.#declarations.entries())
            .map(([_, dec]) => dec)
            .filter(({ excludeFromHelp }) => !excludeFromHelp)
            .map(dec => {
                const names = (indent: number) => {
                    const long = `--${dec.longName}`;
                    const short = dec.shortName ? `-${dec.shortName}` : '';

                    const text = [long, short].filter(n => n !== '').join(', ');
                    return tab(indent) + text;
                }

                const description = (indent: number) => dec.description
                    .map(l => secondary(l))
                    .map(l => tab(indent) + l)
                    .join('\n');

                return [
                    names(1),
                    description(2),
                ].join('\n');
            }).join('\n\n');


        const description: string = this.#desciprion ?? '';

        return [
            `\n${description}`,
            `\n${declarations}`
        ].filter(s => s.trim() !== '').join('\n');
    }


    triggerHelp() {
        throw new InfoInterruption(this.getHelpMessage());
    }


    static isPrintableException(error: Error): boolean {
        return error instanceof PrintableException;
    }


    static rethrowUnprintableException(error: Error) {
        if (!Arguments.isPrintableException(error)) throw error;
    }


    static createHelpDeclaration(): Declaration<boolean> {
        return {
            name: ['help', 'h'],
            type: 'boolean',
            description: 'Show this help message.',
            excludeFromHelp: true,
        }
    }
}
