# **Allo Arguments** for Deno 🦕

A library for Deno that parses the terminal's input parameters.
It allows you to assign default values to them, process them and automatically generate a message for `--help`.


## Example

```ts
import { Arguments, ValueException } from "../mod.ts";
import { join } from "https://deno.land/std@0.125.0/path/mod.ts";


function init() {
    const configConvertor = (v: string | null): string => {
        if (v == null) throw new ValueException(`Path to configuration file is not set. You can set it using "--config=<path>"`)

        return join(Deno.cwd(), v);
    }


    const sleepConvertor = (v: string | number | null): number | null => {
        if (v === null) return null;
        if (typeof v === "string") v = parseInt(v, 10);

        if (isNaN(v)) throw new ValueException(`Délka pauzy musí platné číslo číslo. "--sleep=<number>"`)
        if (v <= 200) throw new ValueException(`Délka pauzy nesmí být menší než 200 ms. "--sleep=<number>"`)

        return v;
    }

    const booleanConvertor = (v: boolean | string | null) => v === true || v === 'true';


    const args = new Arguments(
        {
            name: 'config, c',
            description: `Path to the configuration file in JSON format.`,
            convertor: configConvertor,
            default: 'config.json'
        },
        {
            name: 'delete',
            description: `Deletes all folders according to the configuration file.`,
            convertor: booleanConvertor,
            default: false,
        },
        {
            name: 'sleep, s',
            description: `Sleep duration between processes in milliseconds.`,
            convertor: sleepConvertor,
            default: 5000,
        },
    );

    args.setDescription(`My beautiful program.`);

    args.keepProcessAlive();


    // Important for `--help` flag works.
    if (args.shouldHelp()) args.triggerHelpException();


    const values = {
        config: args.get<string>('config'),
        delete: args.get<boolean>('delete'),
        sleep: args.get<number>('sleep'),
    }


    console.log(values);
}


try {
    // Dont forget to await! (in async scope of course).
    await init();

} catch (error) {
    if (!Arguments.isArgumentException(error)) throw error;
}

```