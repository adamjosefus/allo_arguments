import { parse as stdParse } from "../libs/flags.ts";


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


const command = (command: WithoutTag<Command>): Command => ({
    ...command,
    _tag: "Command",
});

const flag = (flag: WithoutTag<Flag>): Flag => ({
    ...flag,
    _tag: "Flag",
});

const isLongFlag = (arg: string) => arg.startsWith("--");

const isShortFlag = (arg: string) => arg.startsWith("-") && !arg.startsWith("--");

const withoutKey = <T = unknown>(obj: Record<string, T>, key: string) => {
    const { [key]: _, ...rest } = obj;
    return rest;
};


const parseShorts = (raw: string, order: number): Flag[] => {
    const names = raw.slice(1).split("=")[0].split('');
    console.log(names);

    return names.map(name => flag({
        name,
        order,
        value: true,
        short: true,
    }));
}


/**
 * @example
 * ```ts
 * const args = parse(Deno.args());
 * ```
 */
export const parse = (args: string[]) => {
    const commands: Command[] = [];
    const flags: Flag[] = [];

    for (let i = 0; i < args.length; i++) {
        const raw = args[i];

        if (isShortFlag(raw)) {
            const shorts = parseShorts(raw, i);
            shorts.forEach(flag => flags.push(flag));
            continue;
        }

        const parsed = stdParse([raw], {
            boolean: true,
        });

        const alone = parsed._;
        const [key, value] = Object.entries(withoutKey<unknown>(parsed, "_"))[0] ?? [];

        if (alone.length > 0) {
            const lastFlag = flags.at(-1);

            if (lastFlag && lastFlag.short === false &&  lastFlag.value === true) {
                lastFlag.value = `${alone[0]}`;
            } else {
                commands.push(command({
                    name: `${alone[0]}`,
                    order: i,
                }));
            }
        }

        if (key !== undefined) {
            flags.push(flag({
                name: key,
                value: value === undefined ? true : typeof value === 'boolean' ? value : `${value}`,
                order: i,
                short: isShortFlag(raw),
            }));
        }
    }

    return [...commands, ...flags].sort((a, b) => a.order - b.order);
}


const x = parse(Deno.args);

console.log(Deno.args, x);
