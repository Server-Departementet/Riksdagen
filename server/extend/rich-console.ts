
try {
   const colors = require("yoctocolors-cjs");

   type Any = string | number | boolean | null | undefined | Any[] | { [key: string]: Any } | ((...args: Any[]) => Any);

   const levelColors: {
      log: (text: Any) => Any,
      info: (text: Any) => Any,
      warn: (text: Any) => Any,
      error: (text: Any) => Any,
      debug: (text: Any) => Any,
      time: (text: Any) => Any,
   } = {
      log: colors.gray,
      info: colors.blue,
      warn: colors.yellow,
      error: (text: Any) => colors.bgRed(colors.white(colors.bold(text))),
      debug: (text: Any) => colors.cyanBright(colors.italic(text)),
      time: colors.gray,
   };

   const typeColors: {
      string: (text: Any) => Any,
      number: (text: Any) => Any,
      boolean: (text: Any) => Any,
      array: (text: Any) => Any,
      object: (text: Any) => Any,
      function: (text: Any) => Any,
      undefined: (text: Any) => Any,
      null: (text: Any) => Any,
      default: (text: Any) => Any,
   } = {
      string: colors.green,
      number: colors.magenta,
      boolean: colors.cyan,
      array: colors.yellow,
      object: colors.cyan,
      function: colors.magentaBright,
      undefined: colors.gray,
      null: colors.gray,
      default: colors.white,
   }

   const _console = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
   };

   const colorizeType = (data: Any): Any => {
      const type = (Array.isArray(data) ? "array" : data === null ? "null" : typeof data) as keyof typeof typeColors;
      const colorize = typeColors[type] || typeColors.default;

      if (!colorize) return data;

      if (type === "string") return colorize(`"${data}"`);

      if (type === "array") {
         const open = colorize("[") as string;
         const comma = colorize(", ") as string;
         const close = colorize("]") as string;

         const entries = (data as Any[]).map(colorizeType);
         return open + entries.join(comma) + close;
      }

      if (type === "object") {
         const entries = Object.entries(data as Any[]).map(([key, value]) => {
            const colorizeKey = colorize(key); // Keys are treated like "object" to differentiate from "string"
            const colorizeValue = colorizeType(value);
            const colon = colorize(":");
            return `${colorizeKey}${colon}${colorizeValue}`;
         });
         const open = colorize("{") as string;
         const comma = colorize(", ") as string;
         const close = colorize("}") as string;

         return open + entries.join(comma) + close;
      }

      return colorize(data);
   };

   console.log = (...args: Any[]) => {
      _console.log(
         levelColors.time(`[${new Date().toLocaleTimeString()}]`),
         levelColors.log("LOG"),
         "\n",
         ...args.map(colorizeType),
      );
   };
   console.info = (...args: Any[]) => {
      _console.info(
         levelColors.time(`[${new Date().toLocaleTimeString()}]`),
         levelColors.info("INFO"),
         "\n",
         ...args.map(colorizeType),
      );
   };
   console.warn = (...args: Any[]) => {
      _console.warn(
         levelColors.time(`[${new Date().toLocaleTimeString()}]`),
         levelColors.warn("WARN"),
         "\n",
         ...args.map(colorizeType),
      );
   };
   console.error = (...args: Any[]) => {
      _console.error(
         levelColors.time(`[${new Date().toLocaleTimeString()}]`),
         levelColors.error("ERROR"),
         "\n",
         ...args.map(colorizeType),
      );
   };
   console.debug = (...args: Any[]) => {
      _console.debug(
         levelColors.time(`[${new Date().toLocaleTimeString()}]`),
         levelColors.debug("DEBUG"),
         "\n",
         ...args.map(colorizeType),
      );
   };

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_e) { console.info("yoctocolors-cjs not found. Logging will not be rich."); }
