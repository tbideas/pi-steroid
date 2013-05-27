var http = require('http');

var options = {
  hostname: 'checkip.amazonaws.com',
  port: 80,
  path: '/'
};

var WhatsMyIp = {
  getIPAddress: function(cb) {
    var req = http.get(options, function(res) {
        var ip = '';
        res.on('data', function(chunk) {
            ip += chunk;
        });
        res.on('end', function() {
          cb(ip.trim());
        });
        res.on('error', function() {
          cb(undefined);
        });
    });
    req.on('error', function() { cb(undefined); } );
  }
}

WhatsMyIp.exports = WhatsMyIp.getIPAddress;
module.exports = WhatsMyIp;
