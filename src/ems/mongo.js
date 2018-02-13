"use strict";

var mongoClient = require('mongodb').MongoClient;

var config = {};
var db = null;

var mongo = module.exports = {
	setConn: function (username, password, ip, dbName, replicaSetName, cb) {
		console.log('setting mongo connection')

		try {
			if (db) this.close();

			var authString = '';

			if (username && password)
				authString = username + ':' + password + '@';

			config.loginUrl = 'mongodb://' + authString + ip;
			config.dbName = dbName;

			if (replicaSetName)
				config.loginUrl = config.loginUrl + "/" + config.dbName + '?replicaSet=' + replicaSetName;
		} catch (err) { 
			return cb(err);
		}

		return cb();
	},

	open: function (cb) {
		console.log('Opening mongo connection');

		mongoClient.connect(config.loginUrl, function (err, newDb) {
			if (err) return cb(err);

			db = newDb.db(config.dbName);
			cb();
		});
	},

	find: function (collectionName, query, batchSize, cb) {
		var collection = db.collection(collectionName);
		collection.find(query).limit(batchSize).toArray(cb);
	},

	update: function (collectionName, query, update, options, cb) {
		var collection = db.collection(collectionName);
		collection.update(query, update, options, function (err, res) {
			cb(err);
		});
	},

	close: function (cb) {
		if (db) db.close();

		console.log("Closing Mongo Connection");
		db = null;

		if (cb) cb();
	}
};

process.on('exit', function () {
	console.log('-----------------------------------------------')
	console.log('Node is exiting.');

	mongo.close();

	console.log('All Mongo connections are closed, continuing exit.');
	console.log('-----------------------------------------------')
});