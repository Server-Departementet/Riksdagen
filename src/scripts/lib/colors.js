"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = void 0;
/**
 * ANSI code based string coloring functions
 */
exports.colors = {
    /* Text modifiers */
    /**
     * Reset all styling and colors
     * @returns {string} ANSI reset code
     */
    reset: function () { return "\u001B[0m"; },
    /**
     * Apply bold styling to text
     * @param {string} text - Text to make bold
     * @returns {string} Bold-styled text
     */
    bold: function (text) { return "\u001B[1m".concat(text, "\u001B[22m"); },
    /**
     * Apply dim styling to text
     * @param {string} text - Text to make dim
     * @returns {string} Dim-styled text
     */
    dim: function (text) { return "\u001B[2m".concat(text, "\u001B[22m"); },
    /**
     * Apply normal styling to text
     * @param {string} text - Text to make normal
     * @returns {string} Normal-styled
     */
    normal: function (text) { return "\u001B[22m".concat(text, "\u001B[22m"); },
    /**
     * Apply italic styling to text
     * @param {string} text - Text to make italic
     * @returns {string} Italic-styled text
     */
    italic: function (text) { return "\u001B[3m".concat(text, "\u001B[23m"); },
    /**
     * Apply underline styling to text
     * @param {string} text - Text to underline
     * @returns {string} Underlined text
     */
    underline: function (text) { return "\u001B[4m".concat(text, "\u001B[24m"); },
    /**
     * Apply overline styling to text
     * @param {string} text - Text to overline
     * @returns {string} Overlined text
     */
    overline: function (text) { return "\u001B[53m".concat(text, "\u001B[55m"); },
    /**
     * Apply strikethrough styling to text
     * @param {string} text - Text to strikethrough
     * @returns {string} Text with strikethrough
     */
    strikethrough: function (text) { return "\u001B[9m".concat(text, "\u001B[29m"); },
    /* Text colors */
    /**
     * Apply black color to text
     * @param {string} text - Text to color black
     * @returns {string} Black colored text
     */
    black: function (text) { return "\u001B[30m".concat(text, "\u001B[39m"); },
    /**
     * Apply red color to text
     * @param {string} text - Text to color red
     * @returns {string} Red colored text
     */
    red: function (text) { return "\u001B[31m".concat(text, "\u001B[39m"); },
    /**
     * Apply green color to text
     * @param {string} text - Text to color green
     * @returns {string} Green colored text
     */
    green: function (text) { return "\u001B[32m".concat(text, "\u001B[39m"); },
    /**
     * Apply yellow color to text
     * @param {string} text - Text to color yellow
     * @returns {string} Yellow colored text
     */
    yellow: function (text) { return "\u001B[33m".concat(text, "\u001B[39m"); },
    /**
     * Apply blue color to text
     * @param {string} text - Text to color blue
     * @returns {string} Blue colored text
     */
    blue: function (text) { return "\u001B[34m".concat(text, "\u001B[39m"); },
    /**
     * Apply magenta color to text
     * @param {string} text - Text to color magenta
     * @returns {string} Magenta colored text
     */
    magenta: function (text) { return "\u001B[35m".concat(text, "\u001B[39m"); },
    /**
     * Apply cyan color to text
     * @param {string} text - Text to color cyan
     * @returns {string} Cyan colored text
     */
    cyan: function (text) { return "\u001B[36m".concat(text, "\u001B[39m"); },
    /**
     * Apply white color to text
     * @param {string} text - Text to color white
     * @returns {string} White colored text
     */
    white: function (text) { return "\u001B[37m".concat(text, "\u001B[39m"); },
    /**
     * Apply gray color to text (alias for blackBright)
     * @param {string} text - Text to color gray
     * @returns {string} Gray colored text
     */
    gray: function (text) { return exports.colors.blackBright(text); },
    /**
     * Reset text color to default
     * @returns {string} ANSI code to reset foreground color
     */
    defaultFG: function () { return "\u001B[39m"; },
    /* Bright text colors */
    /**
     * Apply bright black (gray) color to text
     * @param {string} text - Text to color bright black
     * @returns {string} Bright black colored text
     */
    blackBright: function (text) { return "\u001B[90m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright red color to text
     * @param {string} text - Text to color bright red
     * @returns {string} Bright red colored text
     */
    redBright: function (text) { return "\u001B[91m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright green color to text
     * @param {string} text - Text to color bright green
     * @returns {string} Bright green colored text
     */
    greenBright: function (text) { return "\u001B[92m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright yellow color to text
     * @param {string} text - Text to color bright yellow
     * @returns {string} Bright yellow colored text
     */
    yellowBright: function (text) { return "\u001B[93m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright blue color to text
     * @param {string} text - Text to color bright blue
     * @returns {string} Bright blue colored text
     */
    blueBright: function (text) { return "\u001B[94m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright magenta color to text
     * @param {string} text - Text to color bright magenta
     * @returns {string} Bright magenta colored text
     */
    magentaBright: function (text) { return "\u001B[95m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright cyan color to text
     * @param {string} text - Text to color bright cyan
     * @returns {string} Bright cyan colored text
     */
    cyanBright: function (text) { return "\u001B[96m".concat(text, "\u001B[39m"); },
    /**
     * Apply bright white color to text
     * @param {string} text - Text to color bright white
     * @returns {string} Bright white colored text
     */
    whiteBright: function (text) { return "\u001B[97m".concat(text, "\u001B[39m"); },
    /* Background Colors */
    /**
     * Apply black background to text
     * @param {string} text - Text to apply black background to
     * @returns {string} Text with black background
     */
    blackBG: function (text) { return "\u001B[40m".concat(text, "\u001B[49m"); },
    /**
     * Apply red background to text
     * @param {string} text - Text to apply red background to
     * @returns {string} Text with red background
     */
    redBG: function (text) { return "\u001B[41m".concat(text, "\u001B[49m"); },
    /**
     * Apply green background to text
     * @param {string} text - Text to apply green background to
     * @returns {string} Text with green background
     */
    greenBG: function (text) { return "\u001B[42m".concat(text, "\u001B[49m"); },
    /**
     * Apply yellow background to text
     * @param {string} text - Text to apply yellow background to
     * @returns {string} Text with yellow background
     */
    yellowBG: function (text) { return "\u001B[43m".concat(text, "\u001B[49m"); },
    /**
     * Apply blue background to text
     * @param {string} text - Text to apply blue background to
     * @returns {string} Text with blue background
     */
    blueBG: function (text) { return "\u001B[44m".concat(text, "\u001B[49m"); },
    /**
     * Apply magenta background to text
     * @param {string} text - Text to apply magenta background to
     * @returns {string} Text with magenta background
     */
    magentaBG: function (text) { return "\u001B[45m".concat(text, "\u001B[49m"); },
    /**
     * Apply cyan background to text
     * @param {string} text - Text to apply cyan background to
     * @returns {string} Text with cyan background
     */
    cyanBG: function (text) { return "\u001B[46m".concat(text, "\u001B[49m"); },
    /**
     * Apply white background to text
     * @param {string} text - Text to apply white background to
     * @returns {string} Text with white background
     */
    whiteBG: function (text) { return "\u001B[47m".concat(text, "\u001B[49m"); },
    /**
     * Apply gray background to text
     * @param {string} text - Text to apply gray background to
     * @returns {string} Text with gray background
     */
    grayBG: function (text) { return "\u001B[100m".concat(text, "\u001B[49m"); },
    /**
     * Reset background color to default
     * @returns {string} ANSI code to reset background color
     */
    defaultBG: function () { return "\u001B[49m"; },
    /* Bright background colors */
    /**
     * Apply bright black background to text
     * @param {string} text - Text to apply bright black background to
     * @returns {string} Text with bright black background
     */
    blackBrightBG: function (text) { return "\u001B[100m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright red background to text
     * @param {string} text - Text to apply bright red background to
     * @returns {string} Text with bright red background
     */
    redBrightBG: function (text) { return "\u001B[101m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright green background to text
     * @param {string} text - Text to apply bright green background to
     * @returns {string} Text with bright green background
     */
    greenBrightBG: function (text) { return "\u001B[102m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright yellow background to text
     * @param {string} text - Text to apply bright yellow background to
     * @returns {string} Text with bright yellow background
     */
    yellowBrightBG: function (text) { return "\u001B[103m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright blue background to text
     * @param {string} text - Text to apply bright blue background to
     * @returns {string} Text with bright blue background
     */
    blueBrightBG: function (text) { return "\u001B[104m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright magenta background to text
     * @param {string} text - Text to apply bright magenta background to
     * @returns {string} Text with bright magenta background
     */
    magentaBrightBG: function (text) { return "\u001B[105m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright cyan background to text
     * @param {string} text - Text to apply bright cyan background to
     * @returns {string} Text with bright cyan background
     */
    cyanBrightBG: function (text) { return "\u001B[106m".concat(text, "\u001B[49m"); },
    /**
     * Apply bright white background to text
     * @param {string} text - Text to apply bright white background to
     * @returns {string} Text with bright white background
     */
    whiteBrightBG: function (text) { return "\u001B[107m".concat(text, "\u001B[49m"); },
    /* Custom code */
    /**
     * Insert any ANSI escape code. Note: does not emit a trailing reset code.
     * @param {string} code - ANSI escape code. https://en.wikipedia.org/wiki/ANSI_escape_code
     * @param {string} [text=""] - Optional text to color
     * @returns {string} Text with custom ANSI code applied
     */
    custom: function (code, text) {
        if (text === void 0) { text = ""; }
        return "\u001B[".concat(code, "m").concat(text || "");
    },
    /**
     * Apply RGB color to text
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @param {string} text - Text to apply RGB color to
     * @returns {string} Text with RGB color applied
     */
    rgb: function (r, g, b, text) { return "\u001B[38;2;".concat(r, ";").concat(g, ";").concat(b, "m").concat(text, "\u001B[39m"); },
    /**
     * Apply RGB color to text background
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @param {string} text - Text to apply RGB background to
     * @returns {string} Text with RGB background applied
     */
    rgbBG: function (r, g, b, text) { return "\u001B[48;2;".concat(r, ";").concat(g, ";").concat(b, "m").concat(text, "\u001B[49m"); },
};
