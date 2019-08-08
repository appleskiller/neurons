
export function processBindingErrorMessage(error, key, sourceCode) {
    return [
        'Template Binding Error',
        error.message,
        '--Info------------------------------------------',
        `Binding Key : ${key}`,
        'Source Code : ',
        sourceCode,
        '--------------------------------------------------------'
    ].join('\n');
}

export function processStatementParserErrorMessage(error, pos, statement) {
    return [
        'Statement Parse Error',
        error.message,
        '--Info------------------------------------------',
        'Source Statement : ',
        statement,
        '--------------------------------------------------------'
    ].join('\n');
}