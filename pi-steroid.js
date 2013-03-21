#!/usr/bin/env node

var util = require("util"),
    path = require('path'),
    fs = require('fs'),
    vm = require("vm"),
    child_process = require('child_process'),
    _ = require("underscore");
    DDPClient = require("ddp");


var host = process.argv[2];
var port = process.argv[3] || 80;

if (!host) {
  console.log("pi-steroid <server> [port]");
  console.log("\n Example:\n  pi-steroid www.pijs.io");
  process.exit(-1);
}

var ddpclient = new DDPClient({ 'host': host, 'port': port});

ddpclient.on('message', function(msg) {
  //console.log("ddp message: %s", msg);

  var msg = JSON.parse(msg);
  if (msg.msg=='changed' && msg.collection == 'devices' && 'code' in msg.fields) {
    runCode(msg.fields.code);
  }
});
ddpclient.on('socket-close', function(code, message) {
  console.log("Socket closed: %s %s", code, message);
});
ddpclient.on('socket-error', function(error) {
  console.log("Socket error: %s", error);
})

var token;

getUniqueToken(function(aToken) {
  token = aToken;

  ddpclient.connect(function() {
    console.log("Connected - my token: %s", token);

    var bundle = require('./package.json');
    ddpclient.call('register', [token, bundle.name, bundle.version],
      function(err, result) {
        if (!result) {
          console.log('Register result: %j (err: %j)', result, err);
          return;
        }

        ddpclient.subscribe('device-code', [aToken], function() {
          console.log("Registered and subscribed");
          if (!('devices' in ddpclient.collections) || Object.keys(ddpclient.collections.devices).length == 0) {
            console.warn("Apparently the server has no device object for me :(");
            return;
          }

          var deviceId = Object.keys(ddpclient.collections.devices)[0];
          var device = ddpclient.collections.devices[deviceId];

          runCode(device.code);
        });

      }
    );

  });
});

var intervals = [];

function runCode(snippet) {
  console.log("running new code snippet: " + snippet);
  // If the last bit of code left some intervals running, delete them
  if (intervals.length > 0) {
    _.each(intervals, function(interval) {
      clearInterval(interval)
    });
    intervals = [];
  }
  try {
    sandbox = {
      'piblaster': require("pi-blaster.js"),
      'util': require("util"),
      'setInterval': function (cb, timeout) {
        intervals.push(setInterval(cb, timeout));
      },
      'console': console
    };
    vm.runInNewContext(snippet, sandbox);
  }
  catch (e) {
    console.log("Error occured parsing script: " + util.inspect(e));
  }
}

function getUniqueToken(cb) {
  try {
    var devs = fs.readdirSync('/sys/class/net/');
    var macs = {};

    // do something to stop when we find
    var found = false;
    for (var i = 0; !found && i < devs.length; i++) {
      dev = devs[i];
      var fn = path.join('/sys/class/net', dev, 'address');
      if(dev.substr(0, 3) == 'eth' && fs.existsSync(fn)) {
        macs[dev] = fs.readFileSync(fn).toString().trim();
        cb(macs[dev]);
        found = true;
      }
    }
    if (found) return;
  }
  catch (err) {
    //console.log("reading mac in /sys/class/net error: " + err);
  }

  try {
    child_process.exec('ifconfig', function(error, stdout, stderr) {
      var found = false;
      var re = new RegExp(/ether (.*)/);
      var lines = stdout.toString().split('\n');
      for (var i = 0; !found && i < lines.length; i++) {
        var line = lines[i];
        if (m = line.match(re)) {
          found = true;
          cb(m[1]);
        }
      }
      if (!found) {
        console.log("Unable to get a unique token on this computer.");
        process.exit(-1);
      }
    });
  }
  catch (err) {
    console.log("ifconfig error: " + err);
    console.log("Unable to get a unique token on this computer.");
    process.exit(-1);
  }
}
