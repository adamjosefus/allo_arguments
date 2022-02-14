import * as colors from "https://deno.land/std@0.125.0/fmt/colors.ts";


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