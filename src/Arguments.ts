/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */
import { Command, Flag, parse } from "./parse.ts";
import { inspect, primary, secondary } from "./helpers/colors.ts";
import { InfoInterruption } from "./InfoInterruption.ts";
import { PrintableException } from "./PrintableException.ts";


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


export type Convertor<T> = {
    (value: undefined | string | boolean): T | undefined;
}


// Convertors
export const booleanConvertor: Convertor<boolean> = v => {
    if (v === undefined) return false;
    if (v === null) return false;
    if (v === false) return false;
    if (v === true) return true;

    const s = `${v}`.toLowerCase().trim();

    if (s === 'true') return true;
    if (s === '1') return true;

    return true;
}

export const stringConvertor: Convertor<string> = v => {
    if (v === undefined) return undefined;

    return `${v}`;
}

export const numberConvertor: Convertor<number> = v => {
    if (v === undefined) return undefined;

    return Number(v);
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


export class Arguments<T extends FlagOptionMap, FlagValues = { [longName in keyof T]: ReturnType<T[longName]['convertor']> | undefined }> {

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
    getFlags(): FlagValues {
        const entries = Array.from(this.#flagDeclarations.keys())
            .map(normalizedName => this.#getFlag(normalizedName));

        return Object.fromEntries(entries) as FlagValues;
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
        const getRawFlag = (name: string) => this.#getRaw(name, 'Flag');

        const dec = this.#flagDeclarations.get(normalizeName(normalizedName));
        if (!dec) throw new Error(notFoundMessage);

        const rawValue = getRawFlag(dec.longName)?.value;
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
    static createHelp() {
        return {
            [helpFlagNames[0]]: {
                convertor: booleanConvertor,
                shortName: helpFlagNames[1],
                description: 'Show this help message.',
                excludeFromHelp: true,
            } as const
        } as const
    }


    static booleanConvertor = booleanConvertor;
    static numberConvertor = numberConvertor;
    static stringConvertor = stringConvertor;
}
