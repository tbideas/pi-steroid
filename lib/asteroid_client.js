var     util = require('util'),
        events = require('events'),
        DDPClient = require("ddp"),
        bundle = require('../package.json'),
        whatsmyip = require('./whatsmyip.js'),
        http = require('http'),
        url = require('url'),
        AsteroidInfos = require('./asteroid_infos.js'),
        AsteroidVM = require('./asteroid_vm.js');

var     KEEPALIVE_INTERVAL = 30; /* seconds */

/*
 * Connects and maintains connection to a remote asteroid server.
 */
var AsteroidClient = function(opts) {
  var self = this;

  // default arguments
  opts = opts || {};
  self.host = opts.host || 'pijs.io';
  self.port = opts.port || 3000;
  self.verbose = opts.verbose || false;
  self.token = opts.token || undefined;

  self._ddpclient = undefined;

  var vmOpts = {};
  if (opts.extraNodePath) {
    vmOpts.extraNodePath = opts.extraNodePath;
  }
  self._vm = new AsteroidVM(vmOpts);
  self._vm.on('writeConsole', function(level, msg) {
    self._writeConsole(level, msg);
  });
  
  self.asteroidInfos = new AsteroidInfos();
};

/**
 * Inherits from EventEmitter
 */
util.inherits(AsteroidClient, events.EventEmitter);

/*
 * Connects to a remote Asteroid server using the DDP protocol.
 */
AsteroidClient.prototype.connect = function() {
  var self = this;

  self._ddpclient = new DDPClient({ 'host': self.host, 'port': self.port});

  // If we receive a message notifying us that the code property of our device
  // description in database has changed, then let's re-run the code.
  self._ddpclient.on('message', function(msg) {
    if (self.verbose)
      console.log("DDP: %s", msg);
    var msg = JSON.parse(msg);
    if (msg.msg=='changed' && msg.collection == 'devices' && 'code' in msg.fields) {
      // Let the message be processed so that the local collection
      // is updated and then fire the event.
      // TODO: A better way to do that would be reactive collections.
      setTimeout(function() {
        self._codeUpdated();
      }, 0);
    }
  });
  self._ddpclient.on('socket-close', function(code, message) {
    console.warn("Socket closed: %s %s", code, message);
  });
  self._ddpclient.on('socket-error', function(error) {
    if (error.message === "unexpected server response (301)" || error.message === "unexpected server response (302)") {
      if (self.verbose) {
        console.warn("Received http redirect - looking for redirect target...");
      }
      self._ddpclient.close();
      self._ddpclient = null;
      self._findRedirectTarget(function(location) {
        var newurl = url.parse(location);

        if (self.verbose) {
          console.log("Redirected to: %s", location);
        }
        self.host = newurl.host;
        
        if (newurl.protocol == 'https') {
          self.port = 443;
        }
        if (newurl.port) {
          self.port = newurl.port;
        }
        self.connect();
      });
    }
    else {
      console.warn("Socket error: %s", error);
    }
  });

  // Actually connect. Success callback will automatically re-run every time we re-connect.
  self._ddpclient.connect(function(error) {
    if (!error) {
      self._registerToServer();
    }
    else {
      console.error("Unable to connect to server: %j", error);
    }
  });
};

AsteroidClient.prototype._findRedirectTarget = function(cb) {
  var self= this;
  
  // Do not start a new request if one is already being processed.
  if (self.__redirectRequest) {
    return;    
  }
  
  var options = {hostname: self.host, port: self.port, path: '/', method: 'HEAD'};
  
  var req = self.__redirectRequest = http.request(options, function(res) {
    if (res.statusCode == "301" || res.statusCode == "302" || res.statusCode == "303") {
      cb(res.headers['location']);
    }
    else {
      console.warn('Expected a 301/302/303 and got: status=%s headers=%j', res.statusCode, res.headers);
    }
    self.__redirectRequest = null;
  });
  req.on('errror', function(e) {
    self.__redirectRequest = null;
    console.warn("Error fetching redirect target (%j): %s", options, e);
  });
  req.end();
}

/*
 * Call the register method to identify ourselves and make sure
 * the server knows who we are.
 */
AsteroidClient.prototype._registerToServer = function() {
  var self = this;
  
  // First we look for our own public IP address through a 3rd party service
  whatsmyip.getIPAddress(function(publicIp) {
    
    infos = self.asteroidInfos.getInfos();
    infos.ip = publicIp;
        
    // Call register method with our bundle version, IP address, etc
    self._ddpclient.call('register', [self.token, bundle.name, bundle.version, infos ],
      function(err, result) {
        if (!result) {
          console.log('Register result: %j (err: %j)', result, err);
          return;
        }
        else {
          /*
           * When we have identified ourselves, we are now 'registered', the next step
           * is to subscribe to updates to the object in database that describes this device.
           */
          self._ddpclient.subscribe('device-code', [self.token], function() {
            /*
             * Once subscribed, we can look at the local copy of our object and execute the code.
             */
            self._codeUpdated();
          });
          
          if (self.upInterval) {
            clearInterval(self.upInterval);
          }
          self.upInterval = setInterval(function() { self._keepAlive(); } , KEEPALIVE_INTERVAL * 1000);
        }
      }
    );
  });
}

/*
 * This is called when we initially subscribes or every time the device object is updated
 * by our subscription.
 */
AsteroidClient.prototype._codeUpdated = function() {
  var self = this;

  var devices = self._ddpclient.collections.devices;

  if (!(devices) || Object.keys(devices).length == 0) {
    console.warn("Apparently the server has no device object for me :(");
    return;
  }

  var deviceId = Object.keys(devices)[0];
  var device = devices[deviceId];

  self._writeConsole('RUNNER', 'Running code...');
  console.log("Running code: " + device.code);
  self._vm.run(device.code);
}

/*
 * Writes a console message to the server. Fire-and-forget.
 */
AsteroidClient.prototype._writeConsole = function(level, msg) {
  var self = this;

  console.log('CONSOLE[%s]: %s', level, msg);
  // Would be cool to keep a buffer of messages so that we can re-transmit them when
  // disconnected and/or group them in batch.
  self._ddpclient.call('writeConsole', [self.token, level, msg], function (err, result) {
    if (err) {
      console.warn("Error writing console message: %j", err);
    }
  });
}

/*
 * Lets the server know we are still alive.
 */
AsteroidClient.prototype._keepAlive = function() {
  var self = this;
  var infos = self.asteroidInfos.getInfos();
  if (self.verbose) {
    console.log("Sending keepalive %j", infos);
  }
  self._ddpclient.call('keepAlive', [ self.token, infos], function(err, result) {
    if (err) {
      console.warn("Error sending up message: %j", err);
    }
  });
}

AsteroidClient.export = AsteroidClient;

module.exports = AsteroidClient;