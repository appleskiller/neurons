/* tslint:disable */
const mathMin = Math.min;
const mathMax = Math.max;
const mathAbs = Math.abs;

export function rgbaFadePair(start, end, spread) {
    var Rs = getSpread(start[0], end[0], spread);
    var Gs = getSpread(start[1], end[1], spread);
    var Bs = getSpread(start[2], end[2], spread);
    var Alphas = getSpread(start[3], end[3], spread);
    return [Rs, Gs, Bs, Alphas]
};
export function getSpread(start, end, fidelity) {
    var minVal = Math.min(start, end);
    var maxVal = Math.max(start, end);
    var difference = maxVal - minVal;
    var iterator = difference / (fidelity-1);
    var out = [minVal];
    var step = minVal;
    for (var e = 1; e < fidelity; e++) {
        step += iterator;
        out.push(step);
    }
    if (start > end) {
        out.reverse()
    }
    return out;
};

export function rgbaFadeSet(parts){
	var out = [[],[],[],[]];//rgba
	for(var i = 0; i<parts.length; i){
		var start = parts[i];
		if(i == parts.length-1){
			break;
		}
		var span = parts[i+1];
		var end = parts[i+2];
		var result = rgbaFadePair(start,end,span);
		for(var j=0 ; j<4; j++){
			out[j] = out[j].concat(result[j]);
		}
		i = i+2;
	}
	return out;
}
export function convertMeasuresToColors(valuearr, colorSet, minMax, f){
	var arr = [].concat(valuearr);
	if(minMax!=undefined){
		arr.push(minMax[0]);
		arr.push(minMax[1]);
	}
	var maxVal = Math.max.apply(Math, arr);
    var minVal = Math.min.apply(Math, arr);
    let i;
	if(minVal<0){
		for(i in arr){
			arr[i] = arr[i] + Math.abs(minVal);
		}
		maxVal = maxVal + Math.abs(minVal);
	}
	if(minVal>0){
		for(i in arr){
			arr[i] = arr[i] - (minVal);
		}
		maxVal = maxVal - (minVal);
	}
	var out = [];
	for(i = 0; i < arr.length; i++){
		var position = Math.round((arr[i]/maxVal)*(colorSet[0].length-1));
		var rgb = "";
		var r = Math.round(colorSet[0][position]);
		var g = Math.round(colorSet[1][position]);
		var b = Math.round(colorSet[2][position]);
		var a = Math.round(colorSet[3][position]);
		if(f == undefined){
			out.push(rgbToCSSRGB(r,g,b,a));
		}else{
			out.push(f(r,g,b,a));
		}
	}

	if(minMax != undefined){
		out = out.slice(0, out.length-2);
	}
	return out;
}

export function convertRGBAArrays(colorSet, f){
	var len = colorSet[0].length;
	if(f == undefined){
		f = rgbToCSSRGB;
	}
	var out = [];
	for(var i=0; i < len; i++){
		var rgba = "";
		var r = Math.round(colorSet[0][i]);
		var g = Math.round(colorSet[1][i]);
		var b = Math.round(colorSet[2][i]);
		var a = Math.round(colorSet[3][i]);
		out.push(f(r,g,b,a));
	}
	return out;
}
export function convertRGBAArray(color, f){
	if(f == undefined){
		f = rgbToCSSRGB;
	}
	var rgba = "";
	var r = Math.round(color[0]);
	var g = Math.round(color[1]);
	var b = Math.round(color[2]);
	var a = Math.round(color[3]);
	return f(r,g,b,a);
}

export const defaultOpacity = 1;
export const pepGreen = [142, 196, 73, 255 * defaultOpacity];
export const pepYellow =  [254, 232, 75, 255 * defaultOpacity];
export const pepBlue = [21, 137, 208, 255 * defaultOpacity];
export const pepRed = [255, 0, 0, 255 * defaultOpacity];

export function rgbToHex(r, g, b, a) {
    return toHex(r) + toHex(g) + toHex(b) + toHex(a);
};
export function rgbToXHex(r, g, b) {
    return "0x" + toHex(r) + toHex(g) + toHex(b);
};
export function rgbToHexPound(r, g, b) {
    return "#" + toHex(r) + toHex(g) + toHex(b);
};
export function rgbToCSSRGB(r, g, b, a) {
    return "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + (Math.round(a) / 255) + ")";
};
export function rgbToHexForKML(r, g, b, a) {
    return toHex(a) + toHex(g) + toHex(b) + toHex(r);
};
export function toHex(n) {
	n = parseInt(n, 10);
	if (isNaN(n)) {
		return "00"
	}
	n = Math.max(0, Math.min(n, 255));
	var base = "0123456789ABCDEF";
	return base.charAt((n - n % 16) / 16) + base.charAt(n % 16)
};

export function to255(n) {
	return parseInt(n, 16)
};
export function xHexto255(h) {
	h = h.split("0x")[1].toString();
	var r = to255(h.substring(0, 2));
	var g = to255(h.substring(2, 4));
	var b = to255(h.substring(4, 6));
	var a = to255(h.substring(6, 8));
	return rgbToCSSRGB(r, g, b, a);
};
export function xHextoRGBAArray(h) {
	h = h.split("0x")[1].toString();
	var r = to255(h.substring(0, 2));
	var g = to255(h.substring(2, 4));
	var b = to255(h.substring(4, 6));
	var a = to255(h.substring(6, 8));
	return [r, g, b, a];
};
export function cssHextoRGBAArray(h) {
	h = h.split("#")[1].toString();
	var r = to255(h.substring(0, 2));
	var g = to255(h.substring(2, 4));
	var b = to255(h.substring(4, 6));
    var a = to255(h.substring(6, 8));
    if (isNaN(a)) {
        a = 255;
    }
	return [r, g, b, a];
};
export function convertCSSrgbToHex(str){
	str = str.toString().toLowerCase();
	var rgb = str.split("(")[1].split(")")[0].split(" ").join("").split(",");
	var r = toHex(Number(rgb[0]));
	var g = toHex(Number(rgb[1]));
	var b = toHex(Number(rgb[2]));
	return "#"+r+g+b;
}
export function rgbaCSStoXHex(str){
  var r = str.split(  "rgba("  )[1].split(",")[0];
  var g = str.split(",")[1];
  var b = str.split(",")[2].split("]")[0];
  return Number(rgbToXHex(r, g, b));
}

export function rgbaCSStoRGBAArray(str){
  //rgba(255,127,153,0.5)
  var r = Number(str.split(  "rgba("  )[1].split(",")[0]);
  var g = Number(str.split(",")[1]);
  var b = Number(str.split(",")[2]);//.split("]")[0];
  var a = Number(str.split(",")[3].split(")")[0]);
  return [r,g,b,a*255];
}

export function toRGBAArray(str) {
    if (!str) return [0,0,0,0];
    if (str.charAt(0) === '#') {
        if (str.length === 4) {
            const arr = str.split('');
            arr[1] = arr[1] + '' + arr[1];
            arr[2] = arr[2] + '' + arr[2];
            arr[3] = arr[3] + '' + arr[3];
            str = arr.join('');
        }
        return cssHextoRGBAArray(str);
    } else if (str.indexOf('0x') === 0) {
        return xHextoRGBAArray(str);
    } else if (str.indexOf('rgb(') === 0) {
        return rgbaCSStoRGBAArray(str.replace('rgb(', 'rgba(').replace(')', ',1)'));
    } else if (str.indexOf('rgba(') === 0) {
        return rgbaCSStoRGBAArray(str);
    } else {
        return [0,0,0,0];
    }
}

// pos: 0~1
export function pickOneColor(color1, color2, pos) {
    const rgba1 = toRGBAArray(color1);
    const rgba2 = toRGBAArray(color2);
    return rgbToCSSRGB(
        rgba1[0] + mathMax(0, mathMin(rgba2[0] - rgba1[0], 255)) * pos,
        rgba1[1] + mathMax(0, mathMin(rgba2[1] - rgba1[1], 255)) * pos,
        rgba1[2] + mathMax(0, mathMin(rgba2[2] - rgba1[2], 255)) * pos,
        rgba1[3] + mathMax(0, mathMin(rgba2[3] - rgba1[3], 255)) * pos,
    )
}

// amount: 0~100
export function lightenColor (color, amount?) {
    amount = (amount === 0) ? 0 : (amount || 5);
    const rgba = toRGBAArray(color);
    const hsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
    
    hsl[2] = hsl[2] + amount;
    hsl[2] = mathMin(100, mathMax(0, hsl[2]));
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], rgba[3]);
}
export function darkenColor(color, amount?) {
    amount = (amount === 0) ? 0 : (amount || 5);
    const rgba = toRGBAArray(color);
    const hsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
    
    hsl[2] = hsl[2] - amount;
    hsl[2] = mathMin(100, mathMax(0, hsl[2]));
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], rgba[3]);
}

/**
 * Mixs color alpha 叠加指定颜色的alpha(0~1)值
 * @author AK
 * @param color 
 * @param alpha 
 * @returns  
 */
export function mixColorAlpha(color, alpha) {
    const baseColor = toRGBAArray(color);
    const a = baseColor[3];
    return rgbToCSSRGB(baseColor[0], baseColor[1], baseColor[2], a * alpha);
}

/**
 * change color alpha to 改变指定颜色的alpha
 * @author AK
 * @param color 
 * @param alpha 
 * @returns  
 */
export function changeColorAlpha(color, alpha) {
    const baseColor = toRGBAArray(color);
    alpha = alpha * 255;
    return rgbToCSSRGB(baseColor[0], baseColor[1], baseColor[2], alpha);
}

// 0, 255 => [0~360, 0~100, 0~100]
function rgbToHsl(r, g, b) {
    r = bound(r, 255);
    g = bound(g, 255);
    b = bound(b, 255);
    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [ h * 360, s * 100, l * 100 ];
}

// [0~360, 0~100, 0~100] => [0, 255]
function hslToRgb(h, s, l) {
    var r, g, b;
    h = bound(h, 360);
    s = bound(s, 100);
    l = bound(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

// [0, n] => [0, 1]
function bound(n, max) {
    n = mathMin(max, mathMax(0, parseFloat(n)));
    if ((Math.abs(n - max) < 0.000001)) { return 1; }
    return (n % max) / parseFloat(max);
}