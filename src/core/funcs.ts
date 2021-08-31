export function _valOrFunc (item: any, val: any, defaultVal: any)  {
    return item ? (typeof item === 'function' ? item.apply(null, val) : item) : defaultVal;
}

export function _round (number, decimalPlaces): number { return Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1); }

export function _clamp (val, min, max): number { return val > max ? max : val < min ? min : val; };