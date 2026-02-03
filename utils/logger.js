import { createLogger, format, transports, addColors } from 'winston';

import config from '../config.json' with { type: 'json' };

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    timestamp: 'gray'
  }
};

addColors(customLevels.colors);

const colorizer = format.colorize();

const logger = createLogger({
  levels: customLevels.levels,
  level: config.debug ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
      const ts = colorizer.colorize('timestamp', `[${timestamp}]`);
      
      const lvl = colorizer.colorize(level, `(${level.toUpperCase()})`);
      
      const msg = colorizer.colorize(level, message);

      return `${ts} ${lvl} ${msg}`;
    })
  ),
  transports: [new transports.Console()]
});

export default logger;
