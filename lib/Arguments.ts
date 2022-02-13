import { parse } from "https://deno.land/std@0.120.0/flags/mod.ts";
import { bold, italic, gray } from "./helpers/colors.ts";
import { ArgumentException } from "./ArgumentException.ts";
import { HelpException } from "./HelpException.ts";
import { ValueException } from "./ValueException.ts";

export type ExpectationProcessorType<V> = {
    // deno-lint-ignore no-explicit-any
    (value: any): V;
}


export type ExpectationType<V = unknown> = {
    name: string | string[],
    default?: V,
    description?: string,
    processor?: ExpectationProcessorType<V>
}


export class Arguments {
    // deno-lint-ignore no-explicit-any
    private raw: any;

    private expectations: {
        names: string[],
        description: string | null,
        default: unknown | null,
        processor: ExpectationProcessorType<unknown>
    }[] = [];


    private desciprion: string | null = null;
    private version: string | null = null;


    constructor(...expectations: ExpectationType[]) {
        this.expectations = this.createExpectations(expectations)

        this.raw = parse(Deno.args);
    }


    private createExpectations(expectation: ExpectationType[]) {
        return expectation.map(ex => {
            const names = ((n) => {
                if (typeof n == 'string')
                    return n.trim().split(/\s+|\s*,\s*/g);
                else
                    return n.map(m => m.trim());
            })(ex.name);

            const description = ((des) => {
                if (des) return des.trim();
                return null;
            })(ex.description);

            const defaultValue = ex.default ?? null;

            const processor = ex.processor ?? ((v) => v);

            return {
                names,
                description,
                default: defaultValue,
                processor
            }
        });
    }


    getRaw(...names: string[]) {
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            if (this.raw[name] !== undefined) return this.raw[name];
        }

        return undefined;
    }


    get<V>(name: string): V {
        const expectation = this.expectations.find(ex => ex.names.find(n => n === name));

        if (!expectation) throw new Error(`Argument "${name}" is not found.`);

        const value = this.getRaw(...expectation.names);
        return expectation.processor(value ?? expectation.default) as V;
    }


    shouldHelp(): boolean {
        return !!this.getRaw('help');
    }


    setDescription(description: string) {
        this.desciprion = description;
    }


    setVersion(version: string) {
        this.version = version.replace(/v([0-9]+(\.[0-9]+)*)/g, (match, p1) => p1);
    }


    keepProcessAlive(message = 'Pro ukončení procesu stiskněte klávesu Enter...') {
        globalThis.addEventListener('unload', () => {
            prompt(message);
        }, { once: true });
    }


    getHelpMessage(): string {
        const docs = this.expectations.map(ex => {
            const margin = '        ';
            const names = ex.names.map(n => `--${bold(n)}`).join(', ')

            const lines = [];
            lines.push(`  ${names}`);

            if (ex.description) {
                ex.description.split('\n').forEach(d => {
                    lines.push(`${margin}${gray(d)}`);
                });
            }

            if (ex.default !== null) {
                lines.push(`${margin}${gray('Výchozí hodnota:')} ${Deno.inspect(ex.default, { colors: true })}`);
            }

            return ['', ...lines, ''].join('\n');
        }).join('\n');


        const description: string[] = [];

        if (this.desciprion) {
            description.push(`${this.desciprion}`);
        }

        if (this.version) {
            description.push(gray(italic(`Verze: ${this.version}`)));
        }

        return [
            description.join('\r\n'),
            docs
        ].filter(s => s !== '').join('\n');
    }


    triggerHelpException() {
        throw new HelpException(this.getHelpMessage());
    }


    static createValueException(message: string): ValueException {
        return new ValueException(message);
    }

    static isArgumentException(error: Error): boolean {
        return error instanceof ArgumentException;
    }
}