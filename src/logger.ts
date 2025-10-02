// logger.ts
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const WinstonLogger = WinstonModule.createLogger({
  level: 'info', // nível mínimo de log
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json() // salva JSON para ElasticSearch
  ),
  transports: [
    // Console colorido para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        nestWinstonModuleUtilities.format.nestLike('HomeTasksApp', { prettyPrint: true }),
      ),
    }),
    // Log completo em arquivo (pronto pra ElasticSearch)
    new winston.transports.File({
      filename: 'logs/requests.log',
      level: 'info',
      format: winston.format.json(),
    }),
    // Log de erros separado
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
  exitOnError: false, // não encerra app em caso de erro
});
