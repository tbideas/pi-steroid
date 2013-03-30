var fs = require('fs'),
    path = require('path'),
    child_process = require('child_process');

/*
 * Calls the callback with the first mac address found for this computer.
 *
 * Right now, two methods are implemented to find the mac address.
 */
var MacAddress = {
  getMacAddress: function(cb) {
    MacAddress.macAddressFromSysfs(function(mac) {
      if (mac)
        cb(mac);
      else
        MacAddress.macAddressFromIfconfig(function(mac) {
          if (mac)
            cb(mac)
          else
            cb(false);
        });
    });
  },


  /* Looks for an ethenet interface in sysfs (Linux) and returns the mac address of
   * the first one found.
   */
  macAddressFromSysfs: function(cb) {
    var mac;

    try {
      var devs = fs.readdirSync('/sys/class/net/');

      for (var i = 0; !mac && i < devs.length; i++) {
        dev = devs[i];
        var fn = path.join('/sys/class/net', dev, 'address');
        if(dev.substr(0, 3) == 'eth' && fs.existsSync(fn)) {
          mac = fs.readFileSync(fn).toString().trim();
        }
      }
    }
    catch (err) {
      //console.log("reading mac in /sys/class/net error: " + err);
    }

    if (mac)
      cb(mac)
    else
      cb(false);
  },

  /*
   * Launch the ifconfig utility (works on Mac) and look for the string 'ether xx:xxx:xx...'
   * Calls the callback with the first mac address found.
   */
  macAddressFromIfconfig: function(cb) {
    var mac;
    try {
      child_process.exec('ifconfig', function(error, stdout, stderr) {
        var re = new RegExp(/ether (.*)/);
        var lines = stdout.toString().split('\n');
        for (var i = 0; !mac && i < lines.length; i++) {
          var line = lines[i];
          if (m = line.match(re)) {
            mac = m[1];
          }
        }
        if (mac)
          cb(mac);
        else
          cb(false);
      });
    }
    catch (err) {
      console.log("ifconfig error: " + err);
      cb(false);
    }
  }
};

MacAddress.export = MacAddress.getMacAddress;
module.exports = MacAddress;
