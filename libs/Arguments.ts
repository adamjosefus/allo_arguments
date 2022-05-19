/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { parse } from "https://deno.land/std@0.138.0/flags/mod.ts";
import { primary, secondary, inspect } from "./helpers/colors.ts";
import { PrintableException } from "./PrintableException.ts";
import { InfoInterruption } from "./InfoInterruption.ts";


export type ConverterType<V> = {
    // deno-lint-ignore no-explicit-any
    (value: any): V;
}


export type DeclarationType<V = unknown> = {
    /**
     * The name of the argument. (e.g. `"port"`)
     * 
     * You can add multiple names, using array or comma-separated string.
     * (e.g. `["port", "p"]` or `"port,p"`)
     */
    name: string | string[],
    /**
     * Default/initial value of the argument.
     */
    default?: V,
    /**
     * The description of the argument.
     */
    description?: string | string[],
    /**
     * Convert value to the specified type.
     */
    convertor?: ConverterType<V>,
    /**
     * Include the argument in the help output.
     */
    includeInHelp?: boolean,
}


export class Arguments {
    // deno-lint-ignore no-explicit-any
    #raw: any;

    #declarations: {
        names: string[],
        descriptionLines: string[] | null,
        default: unknown | null,
        convertor: ConverterType<unknown>,
        includeInHelp: boolean
    }[] = [];

    #desciprion: string | null = null;

    constructor(...declarations: DeclarationType[]) {
        this.#declarations = this.#createDeclarations(declarations)
        this.#raw = parse(Deno.args);
    }


    #createDeclarations(declarations: DeclarationType[]) {
        return declarations.map(dec => {
            const names = ((n) => {
                if (typeof n == 'string') {
                    return n.trim().split(/\s+|\s*,\s*/g);
                }
                return n.map(m => m.trim());
            })(dec.name);

            const descriptionLines = ((des) => {
                if (Array.isArray(des)) return des;
                if (des) return des.trim().split('\n');
                return null;
            })(dec.description);

            const defaultValue = dec.default ?? null;

            const convertor = dec.convertor ?? ((v) => v);

            const includeInHelp = dec.includeInHelp ?? true;

            return {
                names,
                descriptionLines,
                default: defaultValue,
                convertor,
                includeInHelp,
            }
        });
    }


    // deno-lint-ignore no-explicit-any
    #getRaw(...names: string[]): any | undefined {
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            if (this.#raw[name] !== undefined) return this.#raw[name];
        }

        return undefined;
    }


    get<V>(name: string): V {
        const declarations = this.#declarations.find(ex => ex.names.find(n => n === name));

        if (!declarations) throw new Error(`Argument "${name}" is not found.`);

        const value = this.#getRaw(...declarations.names);
        return declarations.convertor(value ?? declarations.default) as V;
    }


    shouldHelp(): boolean {
        return !!this.#getRaw('help');
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
        const declarations = this.#declarations
            .filter(declaration => declaration.includeInHelp)
            .map(declaration => {
                const indent = '        ';
                const names = declaration.names.map(n => `--${primary(n)}`).join(', ')

                const lines = [];
                lines.push(`  ${names}`);

                if (declaration.descriptionLines) {
                    declaration.descriptionLines.forEach(d => lines.push(`${indent}${secondary(d)}`));
                }

                if (declaration.default !== null) {
                    lines.push(`${indent}${secondary('Default:')} ${inspect(declaration.default)}`);
                }

                return lines.join('\n');
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
}
