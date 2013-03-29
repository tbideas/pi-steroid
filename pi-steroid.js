#!/usr/bin/env node

var program = require('commander'),
    MacAddress = require("./lib/mac_address.js"),
    AsteroidClient = require("./lib/asteroid_client.js"),
    bundle = require('./package.json');

program
      .version(bundle.version)
      .option('-s, --server <host>', 'Asteroid server to connect to (default: pijs.io)')
      .option('-p, --port <port>', 'Port to connect to (default: 80', parseInt)
      .option('-v, --verbose', 'Enable verbose mode')
      .parse(process.argv);

var server = program.server || "pijs.io";
var port = program.port || 80;

MacAddress.getMacAddress(function(macAddress) {
  if (!macAddress) {
    console.error("Unable to start without a valid token to identify myself (mac address not found).");
    process.exit(-1);
  }

  var client = new AsteroidClient({
    'host': server,
    'port': port,
    'verbose': program.verbose || false,
    'token': macAddress
  });
  client.connect();
});
