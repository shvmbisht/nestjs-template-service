import winston from 'winston';
import { localConsoleTransport } from './transporters';

export const winstonLogger = winston.createLogger({
  transports: [localConsoleTransport],
});
