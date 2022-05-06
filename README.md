# **Allo Arguments** for Deno 🦕

A library for Deno that parses the terminal's input parameters.
It allows you to assign default values to them, process them and automatically generate a message for `--help`.


## Example

```ts
import { join } from "https://deno.land/std@0.138.0/path/mod.ts";
import { Arguments, ExpectedException } from "https://deno.land/x/allo_arguments/mod.ts";


function getArguments() {
    const configConvertor = (v: string | null): string => {
        if (v == null) throw new ExpectedException(`Path to configuration file is not set. You can set it using "--config=<path>"`)

        return join(Deno.cwd(), v);
    }

    const sleepConvertor = (v: string | number | null): number | null => {
        if (v === null) return null;
        if (typeof v === "string") v = parseInt(v, 10);

        if (isNaN(v)) throw new ExpectedException(`The sleep time must be a valid number. "--sleep=<number>"`)
        if (v <= 200) throw new ExpectedException(`The sleep time must not be less than 200 ms. "--sleep=<number>"`)

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
    if (args.shouldHelp()) args.triggerHelp();


    return {
        config: args.get<string>('config'),
        delete: args.get<boolean>('delete'),
        sleep: args.get<number>('sleep'),
    }
}


try {
    const args = getArguments();

    console.log(args);
    // {
    //   config: "/some/project/path/config.json",
    //   delete: false,
    //   sleep: 5000
    // }

} catch (error) {
    Arguments.rethrowUnprintableException(error);
}
```

## Documentation 📖

Description of all classes and methods will found in the [documentation](https://doc.deno.land/https://deno.land/x/allo_arguments/mod.ts).

---

Check out other [ours packages 📦](https://deno.land/x?query=allo_)!