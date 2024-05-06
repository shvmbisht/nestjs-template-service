import { transports, format } from 'winston';
import config from 'config';

const getDesiredFormat = () => {
  switch (config.get<string>('logger.formatter')) {
    case 'local-custom': {
      return format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, timestamp, data }) => {
          return `${timestamp} | [${level}] ${message} | data=${JSON.stringify(
            data,
          )}`;
        }),
      );
    }
    case 'json': {
      return format.combine(format.timestamp(), format.json());
    }
    default: {
      return format.json();
    }
  }
};

export const localConsoleTransport = new transports.Console({
  format: getDesiredFormat(),
});
