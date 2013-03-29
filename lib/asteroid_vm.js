var util = require('util'),
    vm = require("vm"),
    events = require('events'),
    fs = require('fs'),
    fork = require('child_process').fork,
    temp = require('temp'),
    _ = require("underscore");


var AsteroidVM = function(opts) {
  var self = this;

  opts = opts || {};
  self.extraNodePath = opts.extraNodePath || '';
}

/**
 * Inherits from EventEmitter
 */
util.inherits(AsteroidVM, events.EventEmitter);


/*
 * Combines basic functions below to stop the currently running VM and start
 * a new one with the given code sample.
 */
AsteroidVM.prototype.run = function(code) {
  var self = this;

  // Make sure we stop before running.
  self.stop();

  // Writes the code to a temporary file
  var tempCodeFile = self.prepareCode(code);

  // Spawn a node process to run this code
  var proc = self.fork(tempCodeFile)
}


/*
 * Writes the code to run in a temporary file and returns the path to this file.
 */
AsteroidVM.prototype.prepareCode = function(code) {
  var tempFile = temp.openSync('pijs', 'w');
  var buffer = new Buffer(code, 'utf8');
  fs.writeSync(tempFile.fd, buffer, 0, buffer.length);
  fs.close(tempFile.fd);
  return tempFile.path;
}

/**
 * Creates a new Node process executing the module path given.
 */
 AsteroidVM.prototype.fork = function(modulePath) {
  var self = this;
  var env = process.env;

  /* If asked to, add a self.extraNodePath to the NODE_PATH var */
  if (self.extraNodePath) {
    if (env.NODE_PATH)
      env.NODE_PATH = process.env.NODE_PATH + ':' + self.extraNodePath;
    else
      env.NODE_PATH = self.extraNodePath;
  }

  self.child = fork(modulePath,
                    {
                      silent: true,
                      env: env
                    } );
  self.child.stdout.on('data', function(data) {
    self.emit('writeConsole', 'stdout', self.chomp(data.toString()));
  });
  self.child.stderr.on('data', function(data) {
    self.emit('writeConsole', 'stderr', self.chomp(data.toString()));
  });
 }
 AsteroidVM.prototype.chomp = function(str) {
  if (str.charAt(str.length - 1) == '\n')
    return str.substring(0, str.length - 1);
  return str;
 }

/*
 * Stops a running code.
 *
 * Right now, all this does is remove external setIntervals().
 */
AsteroidVM.prototype.stop = function() {
  var self = this;

  if (self.child) {
    self.child.kill();
    self.child = undefined;
  }
}

AsteroidVM.export = AsteroidVM;
module.exports = AsteroidVM;
