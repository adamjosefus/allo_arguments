export type Convertor<T> = {
    (value: undefined | string | boolean): T;
}
