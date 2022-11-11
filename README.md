# **Allo Arguments** for Deno 🦕

A library for Deno that parses the terminal's input parameters.
It allows you to assign default values to them, process them and automatically generate a message for `--help`.


## Example

```ts
import { join } from "https://deno.land/std/path/mod.ts";
import { Arguments, ExpectedException } from "https://deno.land/x/allo_arguments/mod.ts";


function getArguments() {
    const args = new Arguments({
        ...Arguments.createHelp(),
        'myString': {
            shortName: 's',
            description: 'This is a string flag.',
            convertor: Arguments.stringConvertor,
        },
        'myNumber': {
            shortName: 'n',
            description: 'This is a number flag.',
            convertor: Arguments.numberConvertor,
            default: () => 0
        },
        'myBoolean': {
            shortName: 'b',
            description: 'This is a boolean flag.',
            convertor: Arguments.booleanConvertor,
        },
        'myCustom': {
            shortName: 'c',
            description: 'This is a custom flag.',
            convertor: value => {
                if (value === undefined) return undefined;

                return `🐰 — ${value} — 🐭`;
            },
        },
        'myDeprecated': {
            convertor: Arguments.stringConvertor,
            excludeFromHelp: true
        },
    })
    .setDesciprion("This is a demo of the arguments library.")


    // Important for `--help` flag works.
    if (args.isHelpRequested()) args.triggerHelp();

    return args.getFlags();
}


try {
    const args = getArguments();
    console.log(args);

} catch (error) {
    Arguments.rethrowUnprintableException(error);
}
```

## Documentation 📖

Description of all classes and methods will found in the [documentation](https://doc.deno.land/https://deno.land/x/allo_arguments/mod.ts).

---

Check out other [ours packages 📦](https://deno.land/x?query=allo_)!