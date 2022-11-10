/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import * as colors from "../../libs/deno_std/fmt_colors.ts";


export const primary = (s: string): string => {
    if (Deno.noColor) return s;
    return colors.bold(s);
}


export const secondary = (s: string): string => {
    if (Deno.noColor) return s;
    return colors.gray(s);
}


export const inspect = (s: unknown): string => {
    return Deno.inspect(s, { colors: !Deno.noColor });
}
