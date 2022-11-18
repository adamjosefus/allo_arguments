import { Convertor } from "./Convertor.ts";


export const booleanConvertor: Convertor<boolean | undefined> = v => {
    if (v === false) return false;
    if (v === true) return true;

    const s = `${v}`.toLowerCase().trim();

    if (['true', '1'].includes(s)) return true;
    if (['false', '0'].includes(s)) return false;

    return undefined;
}


export const strictBooleanConvertor: Convertor<boolean> = v => {
    return booleanConvertor(v) ?? false;
}


export const stringConvertor: Convertor<string | undefined> = v => {
    if (v === undefined) return undefined;

    return `${v}`;
}


export const strictStringConvertor: Convertor<string> = v => {
    return stringConvertor(v) ?? '';
}


export const numberConvertor: Convertor<number | undefined> = v => {
    if (v === undefined) return undefined;

    return Number(v);
}


export const strictNumberConvertor: Convertor<number | undefined> = v => {
    return numberConvertor(v) ?? NaN;
}
