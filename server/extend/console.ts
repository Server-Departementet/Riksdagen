const _console = { ...console };
console.info = (...args: any[]) => _console.info("[info]", ...args);
console.error = (...args: any[]) => _console.error("[error]", ...args);
console.log = (...args: any[]) => _console.log("[log]", ...args);
console.warn = (...args: any[]) => _console.warn("[warn]", ...args);