var fs = require('fs'),
    bundle = require('../package.json');

var AsteroidInfos = function() {
  var self = this;
  
  self.memInfoPattern = new RegExp(/MemTotal:\s+(\d+)[\s\S.]*MemFree:\s+(\d+)[\s\S.]*SwapTotal:\s+(\d+)[\s\S.]*SwapFree:\s+(\d+)/);
  self.cpuInfoPattern = new RegExp(/Revision.*?([0-9a-f]+)/);
  self.uptimePattern  = new RegExp(/([0-9.]+)\s+([0-9.]+)/);
  self.loadavgPattern = new RegExp(/([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/);
  self.memInfoPath = "/proc/meminfo";
  self.cpuInfoPath = "/proc/cpuinfo";
  self.uptimePath = "/proc/uptime";
  self.loadavgPath = "/proc/loadavg";
  self.kernelInfoPath = "/proc/version";
}

AsteroidInfos.prototype.getInfos = function() {
  return {
    name: bundle.name, 
    version: bundle.version,
    memory: this.__memoryStat(),
    hardware: this.__hardwareStat(),
    uptime: this.__uptimeStat(),
    loadavg: this.__loadavgStat(),
    kernel: this.__kernelInfo()
  };
}

AsteroidInfos.prototype.__readAndMatch = function(file, pattern) {
  try {
    var content = fs.readFileSync(file);
    var matches = content.toString().match(pattern);
    
    if (matches) {
      return matches;
    }
    console.warn("Failed match (%j) pattern: %s - content: \n---\n%s---\n", matches, pattern, content.toString());
    return false;
  }
  catch (error) {
    console.warn("Unable to read file %s - error: %s", file, error);
    return false;
  }
}

AsteroidInfos.prototype.__memoryStat = function() {
  var memInfo = this.__readAndMatch(this.memInfoPath, this.memInfoPattern);

  if (memInfo) {
    return {
      totalMemory: parseFloat(memInfo[1]),
      freeMemory: parseFloat(memInfo[2]),
      swapTotal: parseFloat(memInfo[3]),
      swapFree: parseFloat(memInfo[4])
    };
  }
  else {
    return {};
  }
}

AsteroidInfos.prototype.__hardwareStat = function() {
  var cpuInfo = this.__readAndMatch(this.cpuInfoPath, this.cpuInfoPattern);
  
  if (cpuInfo) {
    return {
      boardRevision: cpuInfo[1]
    };
  }
  else {
    return {};
  }
}

AsteroidInfos.prototype.__uptimeStat = function() {
  var uptime = this.__readAndMatch(this.uptimePath, this.uptimePattern);
  
  if (uptime) {
    return {
      upTime: parseFloat(uptime[1]),
      idleTime: parseFloat(uptime[2])
    };
  }
  else {
    return {};
  }
}

AsteroidInfos.prototype.__loadavgStat = function() {
  var loadavg = this.__readAndMatch(this.loadavgPath, this.loadavgPattern);
  
  if (loadavg) {
    return {
      '1min': parseFloat(loadavg[1]),
      '5min': parseFloat(loadavg[2]),
      '15min': parseFloat(loadavg[3])
    };
  }
  else {
    return {};
  }
}

AsteroidInfos.prototype.__kernelInfo = function() {
  try {
    var kernelInfo = fs.readFileSync(this.kernelInfoPath);
    return kernelInfo.toString().trim();
  }
  catch (e) {
    return "";
  }
}

AsteroidInfos.export = AsteroidInfos;

module.exports = AsteroidInfos;