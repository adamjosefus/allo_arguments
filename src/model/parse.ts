/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { parse as stdParse } from "../../libs/deno_std/flags.ts";


interface Argument {
    name: string,
    order: number,
}

export interface Command extends Argument {
    readonly _tag: "Command",
}

export interface Flag extends Argument {
    readonly _tag: "Flag",
    value: string | boolean,
    short: boolean,
}

type WithoutTag<T> = Omit<T, "_tag">;


const createCommand = (command: WithoutTag<Command>): Command => ({
    ...command,
    _tag: "Command",
});

const createFlag = (flag: WithoutTag<Flag>): Flag => ({
    ...flag,
    _tag: "Flag",
});


const isShortFlag = (arg: string) => arg.startsWith("-") && !arg.startsWith("--");

const withoutKey = <T = unknown>(obj: Record<string, T>, key: string) => {
    const { [key]: _, ...rest } = obj;
    return rest;
};


/**
 * @example
 * ```ts
 * const args = parse(Deno.args());
 * ```
 */
export const parse = (args: string[]): ReadonlyArray<Readonly<Flag | Command>> => {
    const commands: Command[] = [];
    const flags: Flag[] = [];

    for (let i = 0; i < args.length; i++) {
        const raw = args[i];

        const parsed = stdParse([raw], {
            boolean: true,
            negatable: [],

        });

        const alone = parsed._;
        const [key, rawValue] = Object.entries(withoutKey<unknown>(parsed, "_"))[0] ?? [];

        if (alone.length > 0) {
            const lastFlag = flags.at(-1);

            if (lastFlag && lastFlag.short === false && lastFlag.value === true) {
                lastFlag.value = `${alone[0]}`;
            } else {
                commands.push(createCommand({
                    name: `${alone[0]}`,
                    order: i,
                }));
            }
        }


        if (key !== undefined) {
            const value = rawValue === undefined ? true : typeof rawValue === 'boolean' ? rawValue : `${rawValue}`;
            const order = i;
            const short = isShortFlag(raw);

            flags.push(createFlag({
                name: key,
                value,
                order,
                short,
            }));
        }
    }

    return [...commands, ...flags].sort((a, b) => a.order - b.order);
}
