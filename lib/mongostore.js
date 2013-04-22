var util = require('util'),
  _ = require('underscore'),
  mubsub = require('mubsub'),
  Store = require('socket.io').Store;

var noop = function() {},
  msgpack,
  stringify = JSON.stringify,
  parse = JSON.parse,
  instances = 0,  // TODO Should this be in self
  client; // TODO should this be in self.
try {
  msgpack = require('msgpack');
  stringify = msgpack.pack;
  parse = msgpack.unpack;
} catch(e) {}

/**
 * Mongo store constructor.
 *
 * @see Mongo.options
 * @api public
 */

module.exports = Mongo;
Mongo.Client = Client;

function Mongo(options){
  var self = this;

  options = _.extend({}, Mongo.options, options);

  // Node id to uniquely identify this node.
  self._nodeId = options.nodeId || Math.round(Math.random() * Date.now());
  self._subscriptions = {};

  // all instances share one connection
  if (!client) {
    client = mubsub(options.url,{safe :true});
  }
  //self.client = client;

  self._channel =client.channel(options.collectionPrefix + options.streamCollection, options);
  self._error = self._error.bind(this);

  /*client.connection.db.then(function(err, db) {
   self.emit('connect', err, db);
   });
   */

  instances += 1;
  self.setMaxListeners(0);

  Store.call(this,options);

};

util.inherits(Mongo, Store);

Mongo.version = require('../package.json').version;

Mongo.options = {
   collectionPrefix: 'socket.io.' // collection name is prefix + name
  ,streamCollection: 'stream'     // capped collection name
  ,storageCollection: 'storage'   // collection name used for key/value storage
  ,nodeId: null // id that uniquely identifies this node
  ,size: 100000 // max size in bytes for capped collection
  ,num: null  // max number of documents inside of capped collection
  ,url: null  // db url e.g. "mongodb://localhost:27017/yourdb"
  ,host: 'localhost'  // optionally you can pass everything separately
  ,port: 27017
  ,db: 'mongsocketio'
};


/**
 * Publishes a message.
 * Everything after 1. param will be published as a data.
 *
 * @param {String} event name.
 * @param {Mixed} any data.
 * @api public
 */
Mongo.prototype.publish = function(name, value) {
  var args = [].slice.call(arguments, 1);

  this._channel.publish({
    name: name,
    nodeId: this._nodeId,
    args: stringify(args)
  }, this._error);

  this.emit.apply(this, ['publish', name].concat(args));
  //console.log('store: publish');
  return this;
};

/**
 * Subscribes to a channel.
 *
 * @param {String} event name.
 * @param {Function} callback.
 * @api public
 */
Mongo.prototype.subscribe = function(name, callback) {

  // Check that the message consumed wasn't emitted by this node
  var query = {name: name, nodeId: {$ne: this._nodeId}};

  this._subscriptions[name] = this._channel.subscribe(query, function(doc) {
    callback.apply(null, parse(doc.args));
  });
  this.emit('subscribe', name, callback);
  //console.log('store: subscribe');
  return this;
};

/**
 * Unsubscribes.
 *
 * @param {String} [name] event name, if no name passed - all subscriptions
 *     will be unsubscribed.
 * @param {Function} [callback]
 * @api public
 */
Mongo.prototype.unsubscribe = function(name, callback) {
  if (name) {
    if (this._subscriptions[name]) {
      this._subscriptions[name].unsubscribe();
      delete this._subscriptions[name];
    }
  } else {
    _.each(this._subscriptions, function(subscr) {
      subscr.unsubscribe();
    });
    this._subscriptions = {};
  }

  (callback || noop)();

  this.emit('unsubscribe', name, callback);
  //console.log('store: unsubscribe');
  return this;
};

/**
 * Destroy the store. Close connection.
 *
 * @api public
 */
Mongo.prototype.destroy = function() {
  Store.prototype.destroy.call(this);
  this.removeAllListeners();
  instances -= 1;

  // Only close db connection if this is the only instance, because
  // all instances sharing the same connection

  if (instances <= 0) {
    instances = 0;
    client.close(this._error);
    client = null;
  }

  this.emit('destroy');

  return this;
};

/**
 * Emit error, create Error instance if error is a string.
 *
 * @param {String|Error} err.
 * @api private
 */
Mongo.prototype._error = function(err) {
  if (!err) {
    return this;
  }

  if (typeof err == 'string') {
    err = new Error(err);
  }

  this.emit('error', err);

  return this;
};

/**
 * Get a collection for persistent data.
 *
 * @param {Function} callback.
 * @api protected
 */
Mongo.prototype.getPersistentCollection_ = function(callback) {
  var self = this,
    opts = this.options;

  if (this._persistentCollection) {
    return callback(null, this._persistentCollection);
  } else {
    var name = opts.collectionPrefix + opts.storageCollection;

    var collection = client.db.collection(name);
    //console.log('store: get persistent collection');
    self._persistentCollection = collection;
    callback(null, collection);
  }

  return this;
};


/*
/**
 * Client constructor
 *
 * @api private
 */

function Client (store, id) {
  Store.Client.call(this, store, id);
};

/**
 * Inherits from Store.Client
 */

Client.prototype.__proto__ = Store.Client;
/**
 * Gets a key.
 *
 * @param {String} key.
 * @param {Function} callback.
 * @api public
 */
Client.prototype.get = function(key, callback) {
  var self = this;

  this.store.getPersistentCollection_(function(err, collection) {
    if (err) {
      return callback(err);
    }

    collection.findOne({_id: self.id + key}, function(err, data) {
      if (err) {
        return callback(err);
      }

      callback(null, data ? data.value : null);
    });
  });

  return this;
};

/**
 * Sets a key
 *
 * @param {String} key.
 * @param {Mixed} value.
 * @param {Function} [callback]
 * @api public
 */
Client.prototype.set = function(key, value, callback) {
  var self = this;

  callback || (callback = noop);

  self.store.getPersistentCollection_(function(err, collection) {
    if (err) {
      return callback(err);
    }

    collection.update(
      {_id: self.id + key},
      {$set: {value: value, clientId: self.id}},
      {upsert: true},
      callback
    );
  });

  return self;
};

/**
 * Has a key
 *
 * @param {String} key.
 * @param {Function} callback.
 * @api public
 */
Client.prototype.has = function(key, callback) {
  var self = this;

  this.store.getPersistentCollection_(function(err, collection) {
    if (err) {
      return callback(err);
    }

    collection.findOne({_id: self.id + key}, {_id: 1}, function(err, data) {
      if (err) {
        return callback(err);
      }

      callback(null, Boolean(data));
    });
  });

  return this;
};

/**
 * Deletes a key
 *
 * @param {String} key.
 * @param {Function} [callback].
 * @api public
 */
Client.prototype.del = function(key, callback) {
  var self = this;

  callback || (callback = noop);

  this.store.getPersistentCollection_(function(err, collection) {
    if (err) {
      return callback(err);
    }

    collection.remove({_id: self.id + key}, function(err, data) {
      if (err) {
        return callback(err);
      }

      callback(null);
    });
  });

  return this;
};

/**
 * Destroys the client.
 *
 * @param {Number} [expiration] number of seconds to expire data
 * @param {Function} [callback].
 * @api public
 */
Client.prototype.destroy = function(expiration, callback) {
  var self = this;

  callback || (callback = noop);

  if (typeof expiration == 'number') {
    setTimeout(function() {
      self.destroy(null, callback);
    }, expiration * 1000);

    return this;
  }

  this.store.getPersistentCollection_(function(err, collection) {
    if (err) {
      return callback(err);
    }

    collection.remove({clientId: self.id}, callback);
  });

  return this;
};