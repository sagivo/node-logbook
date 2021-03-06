
require('colors');

//grab original process.std[out|err] functions
//before overwriting
var helper = require('./helper');

var fs = require('fs');
var path = require('path');

// load all loggers
var loggers = {};
var loggersDir = path.join(__dirname, 'loggers');
fs.readdirSync(loggersDir).forEach(function(file) {
  var name = file.replace(/\.js$/,'');
  loggers[name] = require(path.join(loggersDir, file));
});

// intercept console logs and errors and call all handlers
var makeWriteFn = function(type) {
  return function(buffer) {
    //check for active core handler
    for(var l in loggers) {
      var logger = loggers[l];
      if(logger.status.enabled && logger.status[type])
        logger.send(type, buffer);
    }
    //check for user handlers
    handlers.forEach(function(fn) {
      fn(type, buffer);
    });
  };
};

// monkey patch std[out|err]
process.stdout.write = makeWriteFn('log');
process.stderr.write = makeWriteFn('err');

//public methods
exports.configure = function(object) {
  //config each handler
  for(var name in loggers) {
    //skip
    if(!object[name])
      continue;
    //config logger
    loggers[name].configure(object[name]);
  }
  return exports;
};

//user handlers
var handlers = [];
exports.add = function(fn) {
  handlers.push(fn);
  return exports;
};

exports.remove = function(fn) {
  var i = handlers.indexOf(fn);
  if(i === -1) return exports;
  handlers.splice(i,1);
  return exports;
};

exports.loggers = loggers;
