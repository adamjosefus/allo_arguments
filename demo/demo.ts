/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */
import { Arguments } from "../mod.ts";

function getArguments() {
    const args = new Arguments({
        ...Arguments.createHelp(),
        myString: {
            shortName: 's',
            description: 'This is a string flag.',
            convertor: Arguments.stringConvertor,
        },
        myNumber: {
            shortName: 'n',
            description: 'This is a number flag.',
            convertor: Arguments.numberConvertor,
        },
        myBoolean: {
            shortName: 'b',
            description: 'This is a boolean flag.',
            convertor: Arguments.booleanConvertor,
        },
        myCustom: {
            shortName: 'c',
            description: 'This is a custom flag.',
            convertor: value => {
                if (value === undefined) return undefined;

                return `🐰 — ${value} — 🐭`;
            },
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
