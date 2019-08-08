
export type GeometryPoint = {x: number, y: number};
export type GeometryLine = {x1: number, y1: number, x2: number, y2: number};
export type GeometryRect = {x: number, y: number, width: number, height: number};

function correctRect(rect: GeometryRect): GeometryRect {
    if (rect.width < 0) {
        rect.x = rect.x + rect.width;
        rect.width = Math.abs(rect.width);
    }
    if (rect.height < 0) {
        rect.y = rect.y + rect.height;
        rect.height = Math.abs(rect.height);
    }
    return rect;
}

export function pointIntersectPoint(point1: GeometryPoint, point2: GeometryPoint): boolean {
    if (!point1 || !point2) return false;
    return point1.x === point2.x && point1.y === point2.y;
}
export function pointIntersectLine(point: GeometryPoint, line: GeometryLine): boolean {
    if (!point || !line) return false;
    if (line.x1 === line.x2 && line.y1 === line.y2) {
        return pointIntersectPoint(point, {x: line.x1, y: line.y1});
    } else {
        return ((point.x - line.x1) * (line.y1 - line.y2)) === ((line.x1 - line.x2) * (point.y - line.y1))
            && (point.x >= Math.min(line.x1, line.x2) && point.x <= Math.max(line.x1, line.x2))
            &&  ((point.y >= Math.min(line.y1, line.y2)) && (point.y <= Math.max(line.y1, line.y2)));
    }
}
export function pointIntersectRect(point: GeometryPoint, rect: GeometryRect): boolean {
    if (!point || !rect) return false;
    if (rect.width === 0 || rect.height === 0) {
        return pointIntersectLine(point, {x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height});
    } else {
        rect = correctRect(rect);
        return !(point.x < rect.x || point.y < rect.y || point.x > (rect.x + rect.width) || point.y > (rect.y + rect.height));
    }
}
const eps = Math.pow(10, -10);
function dcmp(x) {
    if (Math.abs(x) < eps) return 0;
    return x < 0 ? -1 : 1
}
//  叉乘；
function cross(n, p1, p2){  
    return (p1.x - n.x) * (p2.y - n.y) - (p1.y - n.y) * (p2.x - n.x);  
}
function dot(n, p1, p2) {
    return (p1.x - n.x) * (p2.x - n.x) + (p1.y - n.y) * (p2.y - n.y);
}
function inSegment(n, p1, p2) {
    return (dcmp(cross(n, p1, p2)) === 0) && dcmp(dot(n, p1, p2))<=0;
}
function segmentIntersection(p1, p2, p3, p4) {
    const c1 = cross(p1, p2, p3), c2 = cross(p1, p2, p4);
    const c3 = cross(p3, p4, p1), c4 = cross(p3, p4, p2);
    if (dcmp(c1) * dcmp(c2)<0 && dcmp(c3) * dcmp(c4)<0) return true;
    if (dcmp(c1) === 0 && inSegment(p3,p1,p2)) return true;
    if (dcmp(c2) === 0 && inSegment(p4,p1,p2)) return true;
    if (dcmp(c3) === 0 && inSegment(p1,p3,p4)) return true;
    if (dcmp(c4) === 0 && inSegment(p2,p3,p4)) return true;
    return false;
}

export function lineIntersectLine(line1: GeometryLine, line2: GeometryLine): boolean {
    if (!line1 || !line2) return false;
    if (line1.x1 === line1.x2 && line1.y1 === line1.y2) {
        return pointIntersectLine({x: line1.x1, y: line1.y1}, line2);
    } else if (line2.x1 === line2.x2 && line2.y1 === line2.y2) {
        return pointIntersectLine({x: line2.x1, y: line2.y1}, line1);
    } else {
        const p1 = {x: line1.x1, y: line1.y1};
        const p2 = {x: line1.x2, y: line1.y2};
        const p3 = {x: line2.x1, y: line2.y1};
        const p4 = {x: line2.x2, y: line2.y2};
        //  快速排斥实验；
        return Math.min(p1.x, p2.x) <= Math.max(p3.x, p4.x)
            && Math.min(p3.x, p4.x) <= Math.max(p1.x, p2.x)
            && Math.min(p1.y, p2.y) <= Math.max(p3.y, p4.y)
            && Math.min(p3.y, p4.y) <= Math.max(p1.y, p2.y)
            //  跨立实验；叉乘异号表示在两侧；
            && cross(p1, p2, p3) * cross(p1, p2, p4) < 0
            && cross(p3, p4, p1) * cross(p3, p4, p2) < 0;
    }
}
export function lineIntersectRect(line: GeometryLine, rect: GeometryRect): boolean {
    if (!line || !rect) return false;
    if (rect.width === 0 || rect.height === 0) {
        return lineIntersectLine(line, {x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height})
    } else if (line.x1 === line.x2 && line.y1 === line.y2) {
        return pointIntersectRect({x: line.x1, y: line.y1}, rect);
    } else {
        rect = correctRect(rect);
        const min_x = Math.min(line.x1, line.x2), max_x = Math.max(line.x1, line.x2);
        const min_y = Math.min(line.y1, line.y2), max_y = Math.max(line.y1, line.y2);
        if(min_x >= rect.x && max_x <= (rect.x + rect.width) && min_y >= rect.y && max_y <= (rect.y + rect.height)) {
            //线段在矩形内
            return true;
        } else {
            const points = [];
            points[0] = {x: rect.x, y: rect.y};
            points[1] = {x: rect.x + rect.width, y: rect.y};
            points[2] = {x: rect.x + rect.width, y: rect.y + rect.height};
            points[3] = {x: rect.x, y: rect.y + rect.height};
            for(let i = 0; i < 4; ++i) {
                if(segmentIntersection({x: line.x1, y: line.y1}, {x: line.x2, y: line.y2}, points[i], points[(i+1)%4])) return true;
            }
        }
        return false;
    }
}
export function rectIntersectRect(rect1: GeometryRect, rect2: GeometryRect): boolean {
    if (!rect1 || !rect2) return false;
    if (rect1.width === 0 || rect1.height === 0) {
        return lineIntersectRect({x1: rect1.x, y1: rect1.y, x2: rect1.x + rect1.width, y2: rect1.y + rect1.height}, rect2);
    } else if (rect2.width === 0 || rect2.height === 0) {
        return lineIntersectRect({x1: rect2.x, y1: rect2.y, x2: rect2.x + rect2.width, y2: rect2.y + rect2.height}, rect1);
    } else {
        rect1 = correctRect(rect1);
        rect2 = correctRect(rect2);
        const p1 = [
            Math.max(rect1.x, rect2.x),
            Math.max(rect1.y, rect2.y),
        ];
        const p2 = [
            Math.min(rect1.x + rect1.width, rect2.x + rect2.width),
            Math.min(rect1.y + rect1.height, rect2.y + rect2.height),
        ];
        return p1[0] <= p2[0] && p1[1] <= p2[1];
    }
}

export function intersectLineLine(line1: GeometryLine, line2: GeometryLine): GeometryPoint {
    if (lineIntersectLine(line1, line2)) {
        var d = (line1.y2 - line1.y1) * (line2.x2 - line2.x1) - (line1.x1 - line1.x2) * (line2.y1 - line2.y2);
        var x = ((line1.x2 - line1.x1) * (line2.x2 - line2.x1) * (line2.y1 - line1.y1)
            + (line1.y2 - line1.y1) * (line2.x2 - line2.x1) * line1.x1
            - (line2.y2 - line2.y1) * (line1.x2 - line1.x1) * line2.x1) / d;
        var y = -((line1.y2 - line1.y1) * (line2.y2 - line2.y1) * (line2.x1 - line1.x1)
            + (line1.x2 - line1.x1) * (line2.y2 - line2.y1) * line1.y1
            - (line2.x2 - line2.x1) * (line1.y2 - line1.y1) * line2.y1) / d;
        return {x: x, y: y};
    }
    return null;
}

export function unionRect(rect1: GeometryRect, rect2: GeometryRect): GeometryRect {
    if (!rect1 && !rect2) {
        return {x: 0, y: 0, width: 0, height: 0};
    } else if (rect1 && !rect2) {
        return rect1;
    } else if (!rect1 && rect2) {
        return rect2;
    } else {
        rect1 = correctRect(rect1);
        rect2 = correctRect(rect2);
        const left = Math.min(rect1.x, rect2.x, rect1.x + rect1.width, rect2.x + rect2.width),
            top = Math.min(rect1.y, rect2.y, rect1.y + rect1.height, rect2.y + rect2.height),
            right = Math.max(rect1.x, rect2.x, rect1.x + rect1.width, rect2.x + rect2.width),
            bottom = Math.max(rect1.y, rect2.y, rect1.y + rect1.height, rect2.y + rect2.height);
        return {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
        }
    }
}

export function getQuadraticCurveControlPoint(start: GeometryPoint, end: GeometryPoint, curveness: number = 0.3): GeometryPoint {
    return {
        x: (start.x + end.x) / 2 - (start.y - end.y) * curveness,
        y: (start.y + end.y) / 2 - (end.x - start.x) * curveness
    }
}

export function getQuadraticCurveControlPointWith(start: GeometryPoint, end: GeometryPoint, curveness: number = 0.3, percent: number = 1): { control?: GeometryLine, point: GeometryPoint} {
    if (!curveness) {
        if (percent <= 0) {
            return { point: start }
        } else if (percent >= 1) {
            return { point: end }
        } else {
            const length = lineLength({ x1: start.x, x2: end.x, y1: start.y, y2: end.y });
            const angle = Math.atan2(start.y - end.y, start.x - end.x) * 180 / Math.PI;
            return { point: { x: start.x - length * percent * Math.cos(angle), y: start.y - length * percent * Math.sin(angle) } }
        }
    }
    const ctrlPoint = getQuadraticCurveControlPoint(start, end, curveness);
    if (percent <= 0) {
        return {
            control: {x1: start.x, y1: start.y, x2: ctrlPoint.x, y2: ctrlPoint.y},
            point: start
        }
    } else if (percent >= 1) {
        return {
            control: { x1: ctrlPoint.x, y1: ctrlPoint.y, x2: end.x, y2: end.y },
            point: end
        }
    }
    var v01 = [ctrlPoint.x - start.x, ctrlPoint.y - start.y];
    var v12 = [end.x - ctrlPoint.x, end.y - ctrlPoint.y];
    var q0 = [start.x + v01[0] * percent, start.y + v01[1] * percent];
    var q1 = [ctrlPoint.x + v12[0] * percent, ctrlPoint.y + v12[1] * percent];
    var v = [q1[0] - q0[0], q1[1] - q0[1]];
    var b = [q0[0] + v[0] * percent, q0[1] + v[1] * percent];
    return {
        control: { x1: q0[0], y1: q0[1], x2: q1[0], y2: q1[1] },
        point: { x: b[0], y: b[1] }
    }
}

export function cutQuadraticCurve(start: GeometryPoint, end: GeometryPoint, curveness: number = 0.3, percentStart: number = 0, percentEnd: number = 1): { start: GeometryPoint, end: GeometryPoint, control?: GeometryPoint } {
    const p1 = getQuadraticCurveControlPointWith(start, end, curveness, percentStart);
    const p2 = getQuadraticCurveControlPointWith(start, end, curveness, percentEnd);
    if (!curveness) {
        return {
            start: p1.point,
            end: p2.point,
        }
    } else {
        // 如果控制线不想交则返回null
        const c1 = intersectLineLine(p1.control, p2.control);
        if (c1) {
            return {
                start: p1.point,
                end: p2.point,
                control: c1
            }
        } else {
            return null;
        }
    }
}

export function lineLength(line: GeometryLine): number {
    const x = Math.abs(line.x1 - line.x2);
    const y = Math.abs(line.y1 - line.y2);
    return Math.sqrt(x * x + y * y);
}