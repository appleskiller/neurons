
export function wrapBindingErrorMessage(error, key, sourceCode) {
    const rawMessage = typeof error === 'string' ? error : error.message;
    const message = [
        'Template Binding Error: ',
        rawMessage,
        '--Info------------------------------------------',
        `Binding Key : ${key}`,
        'Source Code : ',
        sourceCode,
        '--------------------------------------------------------'
    ].join('\n');
    if (error instanceof Error) {
        error.message = message;
    } else {
        error = new Error(message);
    }
    return error;
}

export function wrapStatementParserErrorMessage(error, pos, statement) {
    const rawMessage = typeof error === 'string' ? error : error.message;
    const message = [
        'Statement Parse Error: ',
        rawMessage,
        '--Info------------------------------------------',
        'Source Statement : ',
        statement,
        '--------------------------------------------------------'
    ].join('\n');
    if (error instanceof Error) {
        error.message = message;
    } else {
        error = new Error(message);
    }
    return error;
}