var chai = require('chai');
chai.should();

var AsteroidClient = require('../lib/asteroid_client.js');

describe('AsteroidClient', function() {
  describe('new()', function() {
    it('should return an object when called without parameters', function() {
      var client = new AsteroidClient();
    });
  });

  describe('#connect()', function() {
    it('should have a method called connect()', function() {
      var client = new AsteroidClient();
      client.connect();
    });
  })
});
