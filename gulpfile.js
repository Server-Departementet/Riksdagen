const gulp = require("gulp");
const ts = require("gulp-typescript");
const vfs = require("vinyl-fs");
const yarn = require("gulp-yarn");
const { spawn } = require("node:child_process");

let nodeProcess = null;

// Server side TypeScript
// Build once into a bundled file
gulp.task("ts:build", () => {
    return vfs.src("server/**/*.ts")
        .pipe(ts.createProject("server/tsconfig.json")())
        .js.pipe(vfs.dest("server"));
});
// Start the node server on the bundled file
gulp.task("ts:start", () => {
    if (nodeProcess) {
        console.info("Killing server...");
        nodeProcess.kill(0);
    }

    console.info("Starting node server...");
    nodeProcess = spawn("node", ["server/bundle.js"], { stdio: "inherit" });

    return Promise.resolve();
});
// Will rebuild and restart the server on file changes
gulp.task("ts:watch", () => {
    gulp.parallel(
        () => gulp.watch("server/**/*.ts", gulp.series("ts:build", "ts:start"), { ignoreInitial: false }),
        gulp.series("ts:build", "ts:start"), // Initial build and start
    )();
});

// Next.js
gulp.task("next:build", () => {
    return vfs.src("package.json")
        .pipe(yarn({ args: ["install", "--force"] }))
        .pipe(yarn({ args: ["next", "build"] }))
});
gulp.task("next:start", () => {
    return vfs.src("package.json")
        .pipe(yarn({ args: ["install"] }))
        .pipe(yarn({ args: ["next", "start"] }))
});
gulp.task("next:dev", () => {
    return vfs.src("package.json")
        .pipe(yarn({ args: ["install"] }))
        .pipe(yarn({ args: ["next", "dev", "--turbopack"] }))
});
gulp.task("next:lint", () => {
    return vfs.src("package.json")
        .pipe(yarn({ args: ["install"] }))
        .pipe(yarn({ args: ["next", "lint"] }))
});

// Global build (build only)
gulp.task("build", gulp.parallel("ts:build", "next:build"));

// Global start (build and start)
gulp.task("start", gulp.parallel("ts:start", "next:start"));

// Global dev 
gulp.task("dev", gulp.parallel("ts:watch", "next:dev"));