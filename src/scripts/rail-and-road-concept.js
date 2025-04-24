"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var colors_1 = require("./lib/colors");
var cols = process.stdout.columns;
var divider = function () { return console.log("\n".concat("░".repeat(cols), "\n")); };
divider();
var topGray = [153, 153, 153];
var bottomGray = [100, 100, 100];
var fullBlock = {
    n: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["██"], false))], false)),
    e: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["██"], false))], false)),
    s: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["██"], false))], false)),
    w: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["██"], false))], false)),
};
var cornerBlock = {
    nw: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["█▀"], false))], false)),
    ne: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["▀█"], false))], false)),
    se: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["▄█"], false))], false)),
    sw: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["█▄"], false))], false)),
};
var halfBlock = {
    n: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["▀▀"], false))], false)),
    e: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), [" █"], false))], false)),
    s: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["▄▄"], false))], false)),
    w: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["█ "], false))], false)),
};
var quarterBlock = {
    nw: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["▀ "], false))], false)),
    ne: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), [" ▀"], false))], false)),
    se: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), [" ▄"], false))], false)),
    sw: colors_1.colors.rgbBG.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], topGray, false), ["▄ "], false))], false)),
};
console.log("Full:");
console.log(Object.values(fullBlock).join(" "));
console.log("Corner:");
console.log(Object.values(cornerBlock).join(" "));
console.log("Half:");
console.log(Object.values(halfBlock).join(" "));
console.log("Quarter:");
console.log(Object.values(quarterBlock).join(" "));
var gridSize = { h: 30, w: 30 };
var grid = new Array(gridSize.h)
    .fill([])
    .map(function () { return new Array(gridSize.w * 2)
    .fill(" ")
    .map(function (_, i) { return i % 2 ? "]" : "["; })
    .map((function (s) { return colors_1.colors.rgb.apply(colors_1.colors, __spreadArray(__spreadArray([], bottomGray, false), [s], false)); })); });
var x = function (l, A) {
    // Numerical integration using Simpson's rule
    var numSteps = 100;
    var dt = l / numSteps;
    var result = 0;
    for (var i = 0; i <= numSteps; i++) {
        var t = i * dt;
        var weight = (i === 0 || i === numSteps) ? 1 : (i % 2 === 0 ? 2 : 4);
        result += weight * Math.cos(Math.PI * t * t / (2 * A));
    }
    return result * dt / 3;
};
var y = function (l, A) {
    // Numerical integration using Simpson's rule
    var numSteps = 100;
    var dt = l / numSteps;
    var result = 0;
    for (var i = 0; i <= numSteps; i++) {
        var t = i * dt;
        var weight = (i === 0 || i === numSteps) ? 1 : (i % 2 === 0 ? 2 : 4);
        result += weight * Math.sin(Math.PI * t * t / (2 * A));
    }
    return result * dt / 3;
};
var I = new Array(30).fill(0).map(function (_, i) { return i / 50; });
I.forEach(function (i) {
    var xVal = x(i, 1);
    var yVal = y(i, 1);
    var xPos = Math.floor((xVal + 1) * (gridSize.w / 2));
    var yPos = Math.floor((yVal + 1) * (gridSize.h / 2));
    // Replace the two grid x spaces for the full block
});
grid.forEach(function (row, i) {
    console.log(i + "\t" + row.join(""));
});
divider();
