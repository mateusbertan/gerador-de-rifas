import { createLogger, format, transports, addColors } from "winston";
import cliProgress from "cli-progress";

import config from "../config.json" with { type: "json" };

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
    timestamp: "gray",
  },
};

addColors(customLevels.colors);

const colorizer = format.colorize();

const timestamp = () =>
  new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const logger = createLogger({
  levels: customLevels.levels,
  level: config.debug ? "debug" : "info",
  format: format.combine(
    format.printf(({ level, message }) => {
      const ts = colorizer.colorize("timestamp", `[${timestamp()}]`);

      const lvl = colorizer.colorize(level, `(${level.toUpperCase()})`);

      const msg = colorizer.colorize(level, message);

      return `${ts} ${lvl} ${msg}`;
    }),
  ),
  transports: [new transports.Console()],
});

const multibar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: `${colorizer.colorize("timestamp", `[${timestamp()}]`)} ${colorizer.colorize("info", "(INFO) Progresso: {bar} | {percentage}% | {value}/{total} Páginas")}`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  },
  cliProgress.Presets.shades_grey,
);

logger.progress = {
  start: (total, startValue = 0) => multibar.create(total, startValue),
  stop: () => multibar.stop(),
};

export default logger;
