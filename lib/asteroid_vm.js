var util = require('util'),
    vm = require("vm"),
    events = require('events'),
    _ = require("underscore"),
    AsteroidConsole = require('./asteroid_console');


var AsteroidVM = function() {
  var self = this;

  self.console = new AsteroidConsole();
  self.console.on('log', function(msg)   { self.emit('writeConsole', 'log', msg); });
  self.console.on('info', function(msg)  { self.emit('writeConsole', 'info', msg); });
  self.console.on('warn', function(msg)  { self.emit('writeConsole', 'warn', msg); });
  self.console.on('error', function(msg) { self.emit('writeConsole', 'error', msg); });

  self._context = {
    intervals: []
  };
}

/**
 * Inherits from EventEmitter
 */
util.inherits(AsteroidVM, events.EventEmitter);

/*
 * Runs the given piece of code.
 */
AsteroidVM.prototype.run = function(code) {
  var self = this;

  // Make sure we stop before running.
  self.stop();

  try {
    sandbox = {
      'util': require("util"),
      'require': require,
      'setInterval': function (cb, timeout) {
        self._context.intervals.push(setInterval(cb, timeout));
      },
      'console': self.console
    };
    vm.runInNewContext(code, sandbox);
  }
  catch (e) {
    self.emit('writeConsole', 'RUNNER', "Error occured parsing/running script: " + util.inspect(e));
    console.warn('Error occured parsing/running script: ' + util.inspect(e));
  }
}

/*
 * Stops a running code.
 *
 * Right now, all this does is remove external setIntervals().
 */
AsteroidVM.prototype.stop = function() {
  var self = this;

  _.each(self._context.intervals, function(interval) {
    clearInterval(interval)
  });
  self._context.intervals = [];
}

AsteroidVM.export = AsteroidVM;
module.exports = AsteroidVM;
