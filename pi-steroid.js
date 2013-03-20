var util = require("util"),
		path = require('path'),
		fs = require('fs'),
    vm = require("vm"),
		child_process = require('child_process'),
    _ = require("underscore");
		DDPClient = require("ddp");

var host = process.argv[2] || "127.0.0.1";
var port = process.argv[3] || 3000;

var ddpclient = new DDPClient({ 'host': host, 'port': port});

ddpclient.on('message', function(msg) {
	console.log("ddp message: " + msg);
});

var token;

getUniqueToken(function(aToken) {
  token = aToken;

  ddpclient.connect(function() {
  	console.log("Connected - my token: %s", token);

  	var bundle = require('./package.json');
  	ddpclient.call('register', [token, bundle.name, bundle.version],
  	  function(err, result) {
  		  console.log('Register result: %j (err: %j)', result, err);
  	  }
  	);

  	ddpclient.subscribe('device-code', [aToken], function() {
  		var snippets = ddpclient.collections.codes;
  		if (!snippets || snippets.length == 0) {
  			console.log("No code for me right now.");
  		}
  		else {
  			console.log("Running code");
  			runCode(snippets[Object.keys(snippets)[0]].code);
  		}
    });
  });
});


var intervals = [];

function runCode(snippet) {
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
		vm.runInNewContext(snippet + "\nrun();", sandbox);
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
		console.log("reading mac in /sys/class/net error: " + err);
	}

	try {
		child_process.exec('ifconfig', function(error, stdout, stderr) {
			var found = false;
			var re = new RegExp(/ether (.*)/);
			var lines = stdout.toString().split('\n');
			for (var i = 0; !found && i < lines.length; i++) {
				var line = lines[i];
				if (m = line.match(re)) {
					console.log("found!")
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
