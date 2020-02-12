
export function randomStrings(prefix: string, count: number = 5): string[] {
    const result = [];
    for (var i: number = 0; i < count; i++) {
        result.push(`${prefix}${i + 1}`);
    }
    return result;
}

const texts = ['A', 'B', 'C', 'D', 'E', 1, 2, 3, 4, 5]
export function randomTexts(count: number = 5): string[] {
    const result = [];
    for (var i: number = 0; i < count; i++) {
        result.push(`${texts.map(() => texts[parseInt(Math.random() * texts.length + '')]).join('')}${i + 1}`);
    }
    return result;
}