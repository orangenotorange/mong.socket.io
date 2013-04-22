## Socket.io store implementation using mongodb.

This is a socket.io store using mongo based on the socket.io-mongo module by Oleg Slobodskoi.
I updated the store to support the most recent versions of socket.io, mongo, and mubsub.

### Install

    npm install mong.socket.io

### Usage example

    var socketio = require('socket.io'),
        express = require('express'),
        MongoStore = require('mong.socket.io'),
        app = express.createServer(),
        io = io.listen(app);

    app.listen(8000);

    io.configure(function() {
        var store = new MongoStore({url: 'mongodb://localhost:27017/yourdb'});
        store.on('error', console.error);
        io.set('store', store);
    });

    io.sockets.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
            console.log(data);
        });
    });

### Options

    // Default options
    {
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

    new MongoStore(options);


### Run tests
These tests are based on the same suite from socket.io-mongo and written using mocha.
