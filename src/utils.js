export const toRgb8Bit = (r, g, b) => {
    let r = Math.floor(red * 7 / 255);
    let g = Math.floor(green * 7 / 255);
    let b = Math.floor(blue * 3 / 255);

    return (r << 5) | (g << 2) | b;
}

export const toRgb16Bit = (r, g, b) => ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)

export const toHexC = (n, pad) => '0x' + n.toString(16).toUpperCase().padStart(pad, '0')
