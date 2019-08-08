
function fixZero(p) {
    var z = ''
    while (p--) {
        z += '0'
    }
    return z
}
function handle(x) {
    var y = String(x)
    var p = y.lastIndexOf('.')
    if (p === -1) {
        return [y, 0]
    } else {
        return [y.replace('.', ''), y.length - p - 1]
    }
}
// v 操作数1, w 操作数2, s 操作符, t 精度
function calculate(v, w, s, t) {
    switch (s) {
        case '+': return (v + w) / t
        case '-': return (v - w) / t
        case '*': return (v * w) / (t * t)
        case '/': return (v / w)
    }
}

function calculateFloat(a, b, sign) {
    var c: any = handle(a)
    var d: any = handle(b)
    var k = 0

    if (c[1] === 0 && d[1] === 0) {
        return calculate(+c[0], +d[0], sign, 1)
    } else {
        k = Math.pow(10, Math.max(c[1], d[1]))
        if (c[1] !== d[1]) {
            if (c[1] > d[1]) {
                d[0] += fixZero(c[1] - d[1])
            } else {
                c[0] += fixZero(d[1] - c[1])
            }
        }
        return calculate(+c[0], +d[0], sign, k)
    }
}
// 加
export function plus(a, b) {
    return calculateFloat(a, b, '+')
}
// 减
export function minus(a, b) {
    return calculateFloat(a, b, '-')
}
// 乘
export function multiply(a, b) {
    return calculateFloat(a, b, '*')
}
// 除
export function division(a, b) {
    return calculateFloat(a, b, '/')
}
