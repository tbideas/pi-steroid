var chai = require('chai');
chai.should();
var AsteroidInfos = require('../lib/asteroid_infos.js');

describe("AsteroidInfos", function() {
  describe('hardware information', function() {
    var infos;
    
    beforeEach(function() {
      var client = new AsteroidInfos();
      client.cpuInfoPath = "test/procfiles/cpuinfo";
      client.uptimePath = "test/procfiles/uptime";
      client.memInfoPath = "test/procfiles/meminfo";
      client.loadavgPath = "test/procfiles/loadavg";
      client.kernelInfoPath = "test/procfiles/version";
      infos = client.getInfos();
    })
    it('should parse uptime', function() {
      infos.uptime.should.deep.equal({ upTime: 28342.64, idleTime: 28217.44 } );
    });
    it('should parse hardware info (cpuinfo)', function() {
      infos.hardware.should.deep.equal({ boardRevision: '000f' })
    });
    it('should parse loadavg', function() {
      infos.loadavg.should.deep.equal({ '1min': 0.00, '5min': 0.01, '15min': 0.05 });
    });
    it('should parse meminfo', function() {
      infos.memory.should.deep.equal({ totalMemory: 448776, freeMemory: 337864, swapTotal: 102396, swapFree: 102396 });
    });
    it('should parse kernel version', function() {
      infos.kernel.should.equal('Linux version 3.6.11+ (dc4@dc4-arm-01) (gcc version 4.7.2 20120731 (prerelease) (crosstool-NG linaro-1.13.1+bzr2458 - Linaro GCC 2012.08) ) #371 PREEMPT Thu Feb 7 16:31:35 GMT 2013');
    });
  });
});