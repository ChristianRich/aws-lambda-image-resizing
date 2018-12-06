/* istanbul ignore file */
import uuidV4 from 'uuid/v4';

export default class LogService {
  constructor({
    cid, logLevels, context, log,
  } = {}) {
    this.cid = cid || uuidV4();
    this.logLevels = logLevels || (process.env.LOG_LEVELS
      ? process.env.LOG_LEVELS.split(',').map(x => x.toUpperCase())
      : []);
    this.context = {
      cid: this.cid,
      service: process.env.AWS_LAMBDA_FUNCTION_NAME,
      version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
      ...context,
    };
    this.logger = log || console;
  }

  log(level, message, ...data) {
    const log = {
      ...this.context,
      level,
      message,
      data: data.map(x => (x instanceof Error ? {
        name: x.name,
        message: x.message,
        stack: x.stack,
        ...x,
      } : x)),
    };
    this.logger.log(JSON.stringify(log));
  }

  verbose(message, ...data) {
    if (this.logLevels.includes('VERBOSE')) {
      this.log('verbose', message, ...data);
    }
  }

  debug(message, ...data) {
    if (this.logLevels.includes('DEBUG')) {
      this.log('debug', message, ...data);
    }
  }

  info(message, ...data) {
    this.log('info', message, ...data);
  }

  warn(message, ...data) {
    this.log('warn', message, ...data);
  }

  error(message, ...data) {
    this.log('error', message, ...data);
  }

  fatal(message, ...data) {
    this.log('fatal', message, ...data);
  }

  static middleware() {
    return (req, res, next) => {
      req.log = new LogService({ cid: req.cid });
      next();
    };
  }
}
