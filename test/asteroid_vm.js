var fs = require('fs'),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    AsteroidVM = require('../lib/asteroid_vm.js');


var code = "console.log('hello world');";

var vm, path;

describe('AsteroidVM', function() {
  beforeEach(function() {
    vm = new AsteroidVM();
  });

  describe('#prepareCode', function() {
    it('should return a path to a file that exists', function() {
      var path = vm.prepareCode(code);

      should.exist(path);
      path.should.be.a('string');
      fs.existsSync(path).should.equal(true);
    });

    it('should contain the code', function() {
      var path = vm.prepareCode(code);

      var content = fs.readFileSync(path).toString('utf8');
      expect(content).to.be.a('string');
      expect(content).to.equal(code);
    });

  });

  describe('#fork', function() {
    beforeEach(function() {
      path = vm.prepareCode(code);
    });

    it('should create a new node process', function() {
      vm.fork(path);

      expect(vm.child).to.exist;
    });

    it('should emit an event with a stdout message', function(done) {
      vm.on('writeConsole', function(level, message) {
        expect(level).to.be.a('string');
        expect(level).to.be.equal('stdout');

        expect(message).to.be.a('string');
        expect(message).to.be.equal('hello world');
        done();
      });

      vm.fork(path);
    });

    it('should emit an event with a stderr message', function(done) {
      vm.on('writeConsole', function(level, message) {
        expect(level).to.be.a('string');
        expect(level).to.be.equal('stderr');

        expect(message).to.be.a('string');
        expect(message).to.be.equal('error');
        done();
      });
      path = vm.prepareCode('console.error("error")');

      vm.fork(path);
    });

    it('should emit a message when the code does not compile', function(done) {
      vm.on('writeConsole', function(level, message) {
        expect(level).to.be.equal('stderr');
        if (message.indexOf('bogusCode is not defined') !== -1)
          done();
      });
      path = vm.prepareCode('bogusCode');

      vm.fork(path);
    });
  });

  describe('#fork - with extraNodePath', function() {
    var extraNodePath = "/usr/local/lib/node_modules";
    beforeEach(function() {
      vm = new AsteroidVM({ extraNodePath:  extraNodePath } );
      path = vm.prepareCode(code);
    });

    it('should run with the NODE_PATH variable set', function(done) {
      vm.on('writeConsole', function(level, message) {
        expect(level).to.be.equal('stdout');
        expect(message).to.contain(extraNodePath);

        done();
      });
      path = vm.prepareCode('console.log("%j", process.env.NODE_PATH);');
      vm.fork(path);
    });

    it('should run with a NODE_PATH variable set with existing + extra path', function(done) {
      var anotherFolder = "/my_special_folder";
      vm.on('writeConsole', function(level, message) {
        expect(level).to.be.equal('stdout');
        expect(message).to.contain(extraNodePath);
        expect(message).to.contain(anotherFolder);

        done();
      });
      process.env.NODE_PATH = anotherFolder;
      path = vm.prepareCode('console.log("%j", process.env.NODE_PATH);');
      vm.fork(path);
    });

  });

  describe('#stop', function() {
    it('should destroy the child object', function() {
      var vm = new AsteroidVM();
      var path = vm.prepareCode(code);

      vm.fork(path);
      vm.stop();

      expect(vm.child).to.not.exist;
    });
    it('should not fail if no child object existed before', function() {
      var vm = new AsteroidVM();
      var path = vm.prepareCode(code);
      vm.stop();
    })
  });

  describe('#chomp', function() {
    beforeEach(function() { vm = new AsteroidVM() });

    it('should remove a trailing \\n', function() {
      var s = vm.chomp('toto\n');
      s.should.equal('toto');
    });
    it('should not do anything if there is no trailing \\n', function() {
      var s = vm.chomp('toto');
      s.should.equal('toto');
    });
  });

})
