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
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 100;
canvas.height = 100;
for (var i = 0; i < 100; i++) {
    var l = i / 100;
    var A = 1;
    var xValue = x(l, A);
    var yValue = y(l, A);
    ctx.fillStyle = "black";
    ctx.fillRect(xValue + canvas.width / 2, -yValue + canvas.height / 2, 1, 1);
}
