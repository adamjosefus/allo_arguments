/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { absurd } from "./helpers/absurd.ts";
import { Command, Flag, parse } from "./model/parse.ts";
import { primary, secondary } from "./helpers/colors.ts";
import { PrintableException } from "./PrintableException.ts";
import { InfoInterruption } from "./InfoInterruption.ts";


type KeyByValue<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];


interface TypeMap {
    'string': string,
    'number': number,
    'boolean': boolean,
}


interface CommandDeclaration {
    name: string,
    description: string[],
}


export interface FlagOptions<T> {
    shortName?: string,
    type?: KeyByValue<TypeMap, T> extends never ? Converter<T> : KeyByValue<TypeMap, T>,
    description: string,
    default?: () => T,
    validator?: Validator<T>,
    excludeFromHelp?: boolean,
}

interface FlagDeclaration {
    longName: string,
    shortName: string | undefined,
    description: string[],
    // deno-lint-ignore no-explicit-any
    default: (() => any) | undefined,
    // deno-lint-ignore no-explicit-any
    convertor: Converter<any>,
    // deno-lint-ignore no-explicit-any
    validator: Validator<any>,
    excludeFromHelp: boolean,
}


export type Converter<T> = {
    (value: undefined | string | boolean): T;
}

export type Validator<T> = {
    (value: T | undefined): boolean;
}


const normalizeName = (name: string) => name.trim().toLowerCase();
const normalizeShortName = (name: string) => normalizeName(name).substring(0, 1);


const normalizeFlagDeclaration = <T>(name: string, declaration: FlagOptions<T>): FlagDeclaration => {
    const longName = normalizeName(name.trim());
    const shortName = declaration.shortName ? normalizeShortName(declaration.shortName) : undefined;

    const description = declaration.description?.trim().split('\n') ?? undefined

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
    })(declaration.type ?? 'string');

    return {
        longName,
        shortName,
        description,
        default: declaration.default,
        convertor,
        validator: declaration.validator ?? (() => true) as Validator<unknown>,
        excludeFromHelp: declaration.excludeFromHelp ?? false,
    }
}


const helpFlagNames = ['help', 'h'] as const;


export class Arguments {
    #flagDeclarations: Map<string, FlagDeclaration> = new Map();
    #commandDeclaration: Map<string, CommandDeclaration> = new Map();

    #desciprion: string | null;
    #rawArgs: readonly Readonly<Flag | Command>[];


    constructor(description?: string) {
        this.#desciprion = description ?? null;
        this.#rawArgs = parse(Deno.args);
    }


    declareCommand(name: string, description: string) {
        const declaration: CommandDeclaration = {
            name,
            description: description.trim().split('\n'),
        };

        if (this.#commandDeclaration.has(declaration.name)) {
            throw new Error(`Command "${declaration.name}" is already declared.`);
        }

        this.#commandDeclaration.set(declaration.name, declaration);

        return this;
    }


    #getCommand(name: string): CommandDeclaration | undefined {
        return this.#commandDeclaration.get(normalizeName(name));
    }


    hasCommand(name: string): boolean {
        return this.#getCommand(name) !== undefined;
    }


    declareFlag<T>(name: string, options: FlagOptions<T>) {
        const declaration: ReturnType<typeof normalizeFlagDeclaration<T>> = normalizeFlagDeclaration<T>(name, options);

        if (this.#flagDeclarations.has(declaration.longName)) {
            throw new Error(`Flag ${declaration.longName} already exists`);
        }

        const found = declaration.shortName !== undefined && Array.from(this.#flagDeclarations.values()).find(f => f.shortName === declaration.shortName);
        if (found) {
            throw new Error(`Flag ${declaration.shortName} already exists`);
        }

        this.#flagDeclarations.set(declaration.longName, declaration);

        return this;
    }


    declareHelpFlag() {
        this.declareFlag<boolean>(helpFlagNames[0], {
            type: 'boolean',
            shortName: helpFlagNames[1],
            description: 'Show this help message.',
            excludeFromHelp: true,
        });

        return this;
    }


    #getRawFlag(name: string) {
        const flag = this.#rawArgs.filter(r => r._tag === 'Flag') // Filter out commands
            .map(r => r as Flag) // Hack to make the type checker happy
            .find(r => normalizeName(name).includes(normalizeName(r.name)));

        return flag;
    }


    #getFlag<T>(name: string): T | undefined {
        const notFoundMessage = `Argument "${name}" is not declared.`;

        const dec = this.#flagDeclarations.get(normalizeName(name));
        if (!dec) throw new Error(notFoundMessage);

        const flag = this.#getRawFlag(dec.longName);
        if (!flag) throw new Error(notFoundMessage);

        const rawValue = this.#getRawFlag(dec.longName)?.value;
        const value = (rawValue !== undefined ? dec.convertor(rawValue) : dec.default?.() ?? undefined) as T | undefined;

        return value;
    }


    hasFlag(name: string): boolean {
        try {
            return this.#getFlag(name) !== undefined;
        } catch (_error) {
            return false;
        }
    }


    getFlag<T>(name: string): T {
        if (!this.hasFlag(name)) {
            throw new Error("Argument has not been set.");
        }

        return this.#getFlag(name)!;
    }


    isHelpRequested(): boolean {
        return !!this.#getRawFlag(helpFlagNames[0]);
    }


    keepProcessAlive(message = 'Press Enter key to exit the process...') {
        globalThis.addEventListener('unload', () => {
            prompt(message);
        }, { once: true });
    }


    computeHelpMessage(): string {
        const tab = (n = 1) => ' '.repeat(Math.max(n, 1) * 2);

        const declarations = Array.from(this.#flagDeclarations.entries())
            .map(([_, dec]) => dec)
            .filter(({ excludeFromHelp }) => !excludeFromHelp)
            .map(dec => {
                const names = (indent: number) => {
                    const long = `--${dec.longName}`;
                    const short = dec.shortName ? `-${dec.shortName}` : '';

                    const text = [long, short]
                        .filter(n => n !== '')
                        .map(n => primary(n))
                        .join(', ');

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
        throw new InfoInterruption(this.computeHelpMessage());
    }


    static isPrintableException(error: Error): boolean {
        return error instanceof PrintableException;
    }


    static rethrowUnprintableException(error: Error) {
        if (!(error instanceof PrintableException)) throw error;
    }

}
