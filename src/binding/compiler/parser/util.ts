
const falseString = { '0': true, 'false': true, 'undefined': true, 'null': true };
export function string2Boolean(value: string): boolean {
    if (!value) return false;
    return falseString[value.toLowerCase()] ? false : true;
}