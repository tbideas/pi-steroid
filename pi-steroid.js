#!/usr/bin/env node

var util = require("util"),
    path = require('path'),
    vm = require("vm"),
    _ = require("underscore");
    DDPClient = require("ddp");

var MacAddress = require("./lib/mac_address.js");


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

var myToken;

MacAddress.getMacAddress(function(aToken) {
  myToken = aToken;

  ddpclient.connect(function() {
    console.log("Connected - my token: %s", myToken);

    var bundle = require('./package.json');
    ddpclient.call('register', [myToken, bundle.name, bundle.version],
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
