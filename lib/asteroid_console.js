var _ = require('underscore'),
    util = require('util'),
    events = require('events');

AsteroidConsole = function() {
};

util.inherits(AsteroidConsole, events.EventEmitter);


// Quick and dirty

AsteroidConsole.prototype.log = function() {
  console.log.apply(console, arguments);

  this.emit('log', util.format.apply(this, arguments));
};

AsteroidConsole.prototype.info = function() {
  console.info.apply(console, arguments);

  this.emit('info', util.format.apply(this, arguments));
};

AsteroidConsole.prototype.warn = function() {
  console.warn.apply(console, arguments);

  this.emit('warn', util.format.apply(this, arguments));
};

AsteroidConsole.prototype.error = function() {
  console.error.apply(console, arguments);

  this.emit('error', util.format.apply(this, arguments));
};


AsteroidConsole.export = AsteroidConsole;
module.exports = AsteroidConsole;
