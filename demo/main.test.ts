import { join } from "https://deno.land/std@0.128.0/path/mod.ts";
import { Arguments, ValueException } from "../mod.ts";


function getArguments() {
    const configConvertor = (v: string | null): string => {
        if (v == null) throw new ValueException(`Path to configuration file is not set. You can set it using "--config=<path>"`)

        return join(Deno.cwd(), v);
    }


    const sleepConvertor = (v: string | number | null): number | null => {
        if (v === null) return null;
        if (typeof v === "string") v = parseInt(v, 10);

        if (isNaN(v)) throw new ValueException(`The sleep time must be a valid number. "--sleep=<number>"`)
        if (v <= 200) throw new ValueException(`The sleep time must not be less than 200 ms. "--sleep=<number>"`)

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

    return values;
}


try {
    const args = getArguments();
    console.log(args);

} catch (error) {
    if (!Arguments.isArgumentException(error)) throw error;
}