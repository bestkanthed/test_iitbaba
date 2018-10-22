const logs = require('./logger');
const fs = require('fs');

/**
 * Specify where to save images in the public folder
 */

exports.create = (file, savePath) => {
    return new Promise((resolve, reject) => {
      if(!file) return resolve(true);
      file.mv(__dirname+'/../public'+savePath, function(err) {
        if (err) {
          logs.error(err);
          resolve(false);
        }
        else resolve(true); // error page
      });
    });
};

exports.rename = (oldPath, newPath) => {
    return new Promise((resolve, reject) => {
      fs.rename(__dirname+'/../public'+oldPath, __dirname+'/../public'+newPath, function(err) {
          if (err) {
            logs.error(err);
            return resolve(false);
          }
          return resolve(true);
      });
    });
};

exports.delete = (filePath) => {
    return new Promise((resolve, reject) => {
      fs.unlink(__dirname + '/../public' + filePath, function(err) {
          if (err) {
            logs.error(err);
            return resolve(false);
          }
          return resolve(true);
      });
    });
};