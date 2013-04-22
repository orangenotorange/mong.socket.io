var assert = require("assert");
var MongoStore = require('../index');

function createStore() {
  var store = new MongoStore({
    url: 'mongodb://localhost:27017/socketio'
  });

  store.on('error', console.error);

  return store;
}

describe('Subscribe ',function(){
  describe('test that publishing is only listening to other subscribers.', function() {
    var a, b;
    before(function(){
      a = createStore();
      b = createStore();
    });

    after(function(){
      a.destroy();
      b.destroy();
    });

    it('passes over the same server and responds to the other server.', function(done){
      a.subscribe('testevent', function(arg) {
        assert.notEqual(arg, 'eventa', 'A heard the event from A.');
        assert.equal(arg, 'eventb', 'A did not hear the event from B');
        done();
      });

      a.publish('testevent', 'eventa');
      b.publish('testevent', 'eventb');
    });
  });
})

describe('Unsubscribe ',function(){
  describe('test that when you unsubscribe you ingore new events.', function() {
    var a, b;
    before(function(){
      a = createStore();
      b = createStore();
    });

    after(function(){
      a.destroy();
      b.destroy();
    });

    it('subscribes to the event and then unsubscribes and ignores the event', function(done){

      var subscription =  function(arg) {
        assert.equal(arg, 'passevent', 'This is not the pass event.');
        a.unsubscribe('testevent', function() {
          b.publish('testevent', 'failevent');
          done();
        });
      };

      a.subscribe('testevent',subscription);

      b.publish('testevent','passevent');
    });
  });
})

describe('Multiple Subscribers ',function(){
  describe('test that publishing to more than one subscriber works', function() {
    var a, b, c;
    var messageCount;
        before(function(){
      a = createStore();
      b = createStore();
      c = createStore();
      messageCount = 0;
    });

    after(function(){
      a.destroy();
      b.destroy();
      c.destroy();

      assert.equal(messageCount, 6, 'The wrong number of messages were sent.');
    });

    it('creates multiple subscribers and checks to see if the messages are all passed.', function(done){
      var subscription = function(arg1, arg2, arg3) {
        assert.equal(arg1, 1, 'arg1 is not correct');
        assert.equal(arg2, 2, 'arg2 is not correct');
        assert.equal(arg3, 3, 'arg3 is not correct');

        messageCount+=1;
        if(messageCount === 6){
          done();
        }
      };

      a.subscribe('testevent', subscription);
      b.subscribe('testevent', subscription);
      c.subscribe('testevent', subscription);

      a.publish('testevent', 1, 2, 3);
      a.publish('testevent', 1, 2, 3);
      a.publish('testevent', 1, 2, 3);
    });
  });
});
describe('Storing data ',function(){
  describe('test storing data for a client', function() {
    var store,client;
    before(function(){
      store = createStore();
    });
    after(function(){
      store.destroy();
    });

    it('creates a client and tests setting value.', function(done){
      var rand = 'test-' + Date.now();

      client = store.client(rand);
      assert.equal(client.id, rand, 'Client id was not set');
      client.set('a', 'b', function(err) {
        assert.equal(err, null, 'Error setting a value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.get('a', function(err, val) {
        assert.equal(err, null, 'Error getting a value');
        assert.equal(val, 'b', 'Get wrong value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.get('a', function(err, val) {
        assert.equal(err, null, 'Error getting a value');
        assert.equal(val, 'b', 'Get wrong value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.has('a', function(err, has) {
        assert.equal(err, null, 'Error with Has a value');
        assert.equal(has, true, 'Has wrong value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.del('a', function(err) {
        assert.equal(err, null, 'Error getting a value');
        client.has('a', function(err, has) {
          assert.equal(err, null, 'Error with Has after Delete a value');
          assert.equal(has, false, 'Has wrong value after Delete');
          done()
        });
      });
    })

    it('Tests getting a value.', function(done){
      client.set('c', {a: 1}, function(err) {
        assert.equal(err, null, 'Error setting an object');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.set('c', {a: 3}, function(err) {
        assert.equal(err, null, 'Error modifying an object a value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.get('c', function(err, val) {
        assert.equal(err, null, 'Error getting an object');
        assert.deepEqual(val, {a: 3}, 'Got the wrong object');
        done();
      });
    })
  });
});

describe('Storing data ',function(){
  describe('test storing data for a client', function() {
    var store,client;
    before(function(){
      store = createStore();
    });
    after(function(){
      store.destroy();
    });

    it('creates a client and tests setting value.', function(done){
      var rand = 'test-' + Date.now();

      client = store.client(rand);
      assert.equal(client.id, rand, 'Client id was not set');
      client.set('a', 'b', function(err) {
        assert.equal(err, null, 'Error setting a value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.get('a', function(err, val) {
        assert.equal(err, null, 'Error getting a value');
        assert.equal(val, 'b', 'Get wrong value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.get('a', function(err, val) {
        assert.equal(err, null, 'Error getting a value');
        assert.equal(val, 'b', 'Get wrong value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.has('a', function(err, has) {
        assert.equal(err, null, 'Error with Has a value');
        assert.equal(has, true, 'Has wrong value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.del('a', function(err) {
        assert.equal(err, null, 'Error getting a value');
        client.has('a', function(err, has) {
          assert.equal(err, null, 'Error with Has after Delete a value');
          assert.equal(has, false, 'Has wrong value after Delete');
          done()
        });
      });
    })

    it('Tests getting a value.', function(done){
      client.set('c', {a: 1}, function(err) {
        assert.equal(err, null, 'Error setting an object');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.set('c', {a: 3}, function(err) {
        assert.equal(err, null, 'Error modifying an object a value');
        done();
      });
    })

    it('Tests getting a value.', function(done){
      client.get('c', function(err, val) {
        assert.equal(err, null, 'Error getting an object');
        assert.deepEqual(val, {a: 3}, 'Got the wrong object');
        done();
      });
    })
  });
});

describe('Destroy store ',function(){
  describe('test cleaning up data for clients', function() {
    var store,client1,client2;
    before(function(){
        store = createStore(),
        client1 = store.client(Date.now()),
        client2 = store.client(Date.now() + 1);
    });
    after(function(){
      store.destroy();
    });

    it('tests client1 setting value.', function(done){
        client1.set('a', 'b', function(err) {
        assert.equal(err, null, 'client1 set without errors');
        done();
      })
    });

    it('tests client2 setting a value.', function(done){
      client2.set('c', 'd', function(err) {
        assert.equal(err, null, 'client2 set without errors');
        done();
      });
    })

    it('tests client1 has a value ', function(done){
      client1.has('a', function(err, has) {
        assert.equal(err, null, 'client1 has an errors');
        assert.equal(has, true, 'client1 has the wrong value');
        done();
      });
    })

    it('tests client2 getting a value.', function(done){
      client2.has('c', function(err, has) {
        assert.equal(err, null, 'client2 has an error');
        assert.equal(has, true, 'client2 has the wrong value');
        done();
      });
    })

    it('destroy and recreate the store.', function(){
      store.destroy();
      store = createStore();
      client1 = store.client(Date.now());
      client2 = store.client(Date.now() + 1);
      }
    );

    it('tests client1 after being destroyed has a value.', function(done){
      client1.has('a', function(err, has) {
        assert.equal(err, null, 'client1 after destroy has an error');
        assert.equal(has, false, 'client1 after destroy has correct value');
        done();
      });
    })

    it('tests client2 after being destroyed has a value.', function(done){
      client2.has('c', function(err, has) {
        assert.equal(err, null, 'client2 after destroy has errors');
        assert.equal(has, false, 'client2 after destroy has the wrong value');
        done();
      });
    })
  });
});

describe('Destroy a particular client ',function(){
  describe('test cleaning up data store for a client', function() {
    var store,id1,id2,client1,client2;
    before(function(){
      store = createStore(),
        id1 = Date.now(),
        id2 = Date.now() + 1,
        client1 = store.client(id1),
        client2 = store.client(id2);
    });
    after(function(){
      store.destroy();
    });

    it('tests client1 setting value.', function(done){
      client1.set('a', 'b', function(err) {
        assert.equal(err, null, 'client1 set without errors');
        done();
      });
    });

    it('tests client2 setting a value.', function(done){
      client2.set('c', 'd', function(err) {
        assert.equal(err, null, 'client2 set without errors');
        done();
      });
    })

    it('tests client1 has a value ', function(done){
      client1.has('a', function(err, has) {
        assert.equal(err, null, 'client1 has without errors');
        assert.equal(has, true, 'client1 has correct value');
        done();
      });
    })

    it('tests client2 getting a value.', function(done){
      client2.has('c', function(err, has) {
        assert.equal(err, null, 'client2 has without errors');
        assert.equal(has, true, 'client2 has correct value');
        done();
      });
    })

    it('destroy the store and see if the client is still there.', function(){
        assert.equal(id1 in store.clients, true, 'client1 is in clients');
        assert.equal(id2 in store.clients, true, 'client2 is in clients');
        store.destroyClient(id1);
        assert.equal(id1 in store.clients, false, 'client1 is in clients');
        assert.equal(id2 in store.clients, true, 'client2 is in clients');
      }
    );

    it('tests client1 after being destroyed has a value.', function(done){
      client1.has('a', function(err, has) {
        assert.equal(err, null, 'client1 after destroy has without errors');
        assert.equal(has, false, 'client1 after destroy has correct value');
        done();
      });
    })
  });
});

describe('Destroy expiration ',function(){
  this.timeout(5000);
  describe('test cleaning up data store for a client', function() {
    var store,id,client;
    before(function(){
      store = createStore(),
      id = Date.now();
      client = store.client(id);
    });
    after(function(){
      store.destroy();
    });

    it('tests client2 setting wihtout an error', function(done){
      client.set('a', 'b', function(err) {
        assert.equal(err, null, 'set without errors');
        done();
      });
    })
    it('tests client2 after being destroyed has a value.', function(done){
      store.destroyClient(id, 1);
      setTimeout(function() {
        done();
      }, 500);
    })
    it('tests client2 after being destroyed has a value.', function(done){
      client.get('a', function(err, val) {
        assert.equal(err, null, 'get without errors');
        assert.equal(val, 'b', 'get correct value');
        setTimeout(function() {
          done();
        }, 2000);
      });
    })
    it('tests client2 after being destroyed has a value.', function(done){
      client.get('a', function(err, val) {
        assert.equal(err, null, 'get without errors after expiration');
        assert.equal(val, null, 'get correct value after expiration');
        done();
      });
    })
  });
});