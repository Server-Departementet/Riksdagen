var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
/** Size in blocks */
var size = { w: 50, h: 50 };
/** Size in pixels (each block is 2x2 pixels for details) */
canvas.width = size.w * 2;
canvas.height = size.h * 2;
// Checkerboard
ctx.fillStyle = "whitesmoke";
for (var i = 0; i < canvas.width * canvas.height; i += 2) {
    var x = (i % canvas.width);
    var y = Math.floor(i / canvas.width);
    console.log(x % 2, y % 2);
    if (x % 2 === 0) {
        if (y % 2 === 0) {
            ctx.fillRect(x * 2, y * 2, 2, 2);
        }
        else {
            ctx.fillRect((x + 1) * 2, y * 2, 2, 2);
        }
    }
}
var topGray = [153, 153, 153];
var bottomGray = [125, 125, 125];
var sprite = function () {
    var points = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        points[_i] = arguments[_i];
    }
    var spriteCanvas = new OffscreenCanvas(2, 2);
    var spriteCtx = spriteCanvas.getContext("2d");
    spriteCanvas.width = 2;
    spriteCanvas.height = 2;
    // Background
    spriteCtx.fillStyle = "rgb(".concat(bottomGray.join(", "), ")");
    spriteCtx.fillRect(0, 0, 2, 2);
    // Points
    spriteCtx.fillStyle = "rgb(".concat(topGray.join(", "), ")");
    points.forEach(function (point) {
        var x = point[0], y = point[1];
        spriteCtx.fillRect(x, y, 1, 1);
    });
    return spriteCanvas.transferToImageBitmap();
};
var block = sprite([0, 0], [1, 0], [0, 1], [1, 1]);
var stairCorner = {
    nw: sprite([0, 0], [1, 0], [0, 1]),
    ne: sprite([0, 0], [1, 0], [1, 1]),
    se: sprite([1, 0], [0, 1], [1, 1]),
    sw: sprite([0, 0], [0, 1], [1, 1]),
};
var stairHalf = {
    n: sprite([0, 0], [1, 0]),
    e: sprite([1, 0], [1, 1]),
    s: sprite([0, 1], [1, 1]),
    w: sprite([0, 0], [0, 1]),
};
var quarter = {
    nw: sprite([0, 0]),
    ne: sprite([1, 0]),
    se: sprite([1, 1]),
    sw: sprite([0, 1]),
};
// Block
ctx.drawImage(block, 2, 2);
// Corner
ctx.drawImage(stairCorner.nw, 2, 6);
ctx.drawImage(stairCorner.ne, 6, 6);
ctx.drawImage(stairCorner.se, 10, 6);
ctx.drawImage(stairCorner.sw, 14, 6);
// Half
ctx.drawImage(stairHalf.n, 2, 10);
ctx.drawImage(stairHalf.e, 6, 10);
ctx.drawImage(stairHalf.s, 10, 10);
ctx.drawImage(stairHalf.w, 14, 10);
// Quarter
ctx.drawImage(quarter.nw, 2, 14);
ctx.drawImage(quarter.ne, 6, 14);
ctx.drawImage(quarter.se, 10, 14);
ctx.drawImage(quarter.sw, 14, 14);
