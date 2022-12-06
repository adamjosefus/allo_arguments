/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { Command, Flag, parse } from "./parse.ts";
import { inspect, primary, secondary } from "./helpers/colors.ts";
import { PrintableException, InfoInterruption } from "./exceptions.ts";
import { Convertor } from "./Convertor.ts";
import { booleanConvertor, numberConvertor, strictBooleanConvertor, strictNumberConvertor, strictStringConvertor, stringConvertor } from "./convertors.ts";


export type FlagOptions<T> = {
    convertor: Convertor<T>,
    shortName?: string,
    description?: string,
    default?: () => T,
    excludeFromHelp?: boolean,
}

/**
 * @internal
 */
interface FlagDeclaration {
    longName: string,
    shortName: string | undefined,
    description: string[],
    default: (() => unknown) | undefined,
    convertor: Convertor<unknown>,
    excludeFromHelp: boolean,
}


const helpFlagNames = ['help', 'h'] as const;

const normalizeName = (name: string) => name.trim().toLowerCase();
const normalizeShortName = (name: string) => normalizeName(name).substring(0, 1);

const createFlagDeclarations = (options: Record<string, FlagOptions<unknown>>) => {
    const entries = Object.entries(options)
        .map(([name, op]) => {
            const normalizedName = normalizeName(name);
            return [normalizedName, {
                longName: name,
                shortName: op.shortName ? normalizeShortName(op.shortName) : undefined,
                description: op.description?.trim().split('\n') ?? undefined,
                default: op.default,
                convertor: op.convertor,
                excludeFromHelp: op.excludeFromHelp ?? false,
            }] as [string, FlagDeclaration];
        });

    return new Map(entries);
}


type FlagOptionMap = {
    [longName: string]: FlagOptions<unknown>,
}


export class Arguments<T extends FlagOptionMap, FlagValues = {
    [longName in keyof T]: T[longName]['default'] extends () => infer U
    ? (ReturnType<T[longName]['convertor']> extends U | undefined ? U : ReturnType<T[longName]['convertor']> | U)
    : ReturnType<T[longName]['convertor']>
}> {

    #rawArgs: readonly Readonly<Flag | Command>[];

    #flagDeclarations: Map<string, FlagDeclaration> = new Map();

    #description: string | null = null;


    constructor(flagOptions: T) {
        this.#flagDeclarations = createFlagDeclarations(flagOptions);
        this.#rawArgs = parse(Deno.args);
    }

    /**
     * Gets converted flag values.
     * 
     * @returns The key-value pairs of the flags.
     */
    getFlags(): Readonly<FlagValues> {
        const entries = Array.from(this.#flagDeclarations.keys())
            .map(normalizedName => this.#getFlag(normalizedName));

        return Object.freeze(Object.fromEntries(entries) as FlagValues);
    }

    /**
     * @param description The description of the program.
     * @returns self for chaining.
     */
    setDescription(description: string) {
        this.#description = description.trim();

        return this;
    }


    #getRaw(name: string, tag: 'Flag'): Flag | undefined;
    #getRaw(name: string, tag: 'Command'): Flag | undefined;
    #getRaw(name: string, tag: 'Flag' | 'Command'): unknown | undefined {
        const flag = this.#rawArgs
            .filter(arg => arg._tag === tag) // Filter out commands
            .find(f => normalizeName(f.name) === normalizeName(name));

        return flag;
    }


    #getFlag<T>(normalizedName: string): [longName: string, value: T | undefined] {
        const notFoundMessage = `Argument "${normalizedName}" is not declared.`;

        const getRawFlag = (type: 'long' | 'short', name: string | undefined) => {
            if (!name) return undefined;

            const raw = this.#getRaw(name, 'Flag');
            if (!raw) return undefined;

            if (raw.short && type === 'short') return raw;
            else if (!raw.short && type === 'long') return raw;

            return undefined;
        };

        const dec = this.#flagDeclarations.get(normalizeName(normalizedName));
        if (!dec) throw new Error(notFoundMessage);

        const flag = getRawFlag('long', dec.longName) ?? getRawFlag('short', dec.shortName);
        const rawValue = flag?.value;
        const value = (rawValue !== undefined ? dec.convertor(rawValue) : dec.default?.() ?? undefined) as T | undefined;

        return [dec.longName, value];
    }

    /**
     * Gets boolean value indicating whether the help flag is requested.
     * 
     * @returns `true` if the help flag is present.
     */
    isHelpRequested(): boolean {
        const [_longName, value] = this.#getFlag(helpFlagNames[0]);

        return value === true;
    }


    /**
     * @deprecated Use `isHelpRequested` instead.
     */
    shouldHelp() {
        return this.isHelpRequested();
    }

    /**
     * If this method is called, the program will exit with the message and wait for the user to press any key.
     * 
     * @param message The message to print.
     */
    keepProcessAlive(message = 'Press Enter key to exit the process...') {
        globalThis.addEventListener('unload', () => {
            prompt(message);
        }, { once: true });
    }


    /**
     * Prints the help message and exits the process.
     */
    triggerHelp() {
        throw new InfoInterruption(this.#computeHelpMessage());
    }


    #computeHelpMessage(): string {
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

                const defaultValue = (indent: number) => {
                    if (dec.default === undefined) return '';

                    const serialized = inspect(dec.default()).split('\n');

                    return tab(indent) + secondary(`Default: `) + serialized.join('\n' + tab(indent + 2));
                }

                return [
                    names(1),
                    description(2),
                    defaultValue(2),
                ].filter(s => s !== '').join('\n');
            }).join('\n\n');


        const description: string = this.#description ?? '';

        return [
            `\n${description}`,
            `\n${declarations}`
        ].filter(s => s.trim() !== '').join('\n');
    }

    /**
     * Detect if the error is instance of `PrintableException` class.
     */
    static isPrintableException(error: Error): boolean {
        return error instanceof PrintableException;
    }

    /**
     * Trows the error if it is not instance of `PrintableException` class.
     * 
     * @example
     * ```ts
     * try {
     *    // ...
     * } catch (error) {
     *   Arguments.throwIfNotPrintable(error);
     * }
     * ```
     */
    static rethrowUnprintableException(error: Error) {
        if (!(error instanceof PrintableException)) throw error;
    }

    /**
     * Creates options of `help` flag.
     * 
     * @example
     * ```ts
     * const args = new Arguments({
     *    ...Arguments.createHelp(),
     *   // ...
     * });
     */
    static createHelpOptions() {
        return {
            [helpFlagNames[0]]: {
                shortName: helpFlagNames[1],
                description: 'Show this help message.',
                convertor: strictBooleanConvertor,
                excludeFromHelp: true,
            } as const
        } as const
        // } satisfies FlagOptions<boolean>; // For typescript >= 4.9
    }


    static booleanConvertor = booleanConvertor;
    static strictBooleanConvertor = strictBooleanConvertor;


    static numberConvertor = numberConvertor;
    static strictNumberConvertor = strictNumberConvertor;


    static stringConvertor = stringConvertor;
    static strictStringConvertor = strictStringConvertor;
}
