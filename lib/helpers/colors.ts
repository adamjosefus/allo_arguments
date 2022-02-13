import * as colors from "https://deno.land/std@0.125.0/fmt/colors.ts";


export const bold = (s: string): string => {
    if (Deno.noColor) return s;
    return colors.bold(s);
}


export const italic = (s: string): string => {
    if (Deno.noColor) return s;
    return colors.italic(s);
}


export const gray = (s: string): string => {
    if (Deno.noColor) return s;
    return colors.gray(s);
}
