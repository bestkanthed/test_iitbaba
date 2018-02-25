const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'error',
      filename: 'errors.log',
      level: 'error'
    }),
    new (winston.transports.File)({
      name: 'info',
      filename: 'info.log',
      level: 'info'
    })
  ]
});

module.exports = logger;