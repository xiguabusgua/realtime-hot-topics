const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  }

  _format(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  debug(message, meta) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this._format('DEBUG', message, meta));
    }
  }

  info(message, meta) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this._format('INFO', message, meta));
    }
  }

  warn(message, meta) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this._format('WARN', message, meta));
    }
  }

  error(message, meta) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this._format('ERROR', message, meta));
    }
  }
}

module.exports = new Logger(process.env.LOG_LEVEL || 'INFO');
