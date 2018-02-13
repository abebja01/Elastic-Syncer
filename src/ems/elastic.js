"use strict";
var elasticsearch = require('elasticsearch')
var config = require('../../config').elasticConfig;


var client = new elasticsearch.Client({ hosts: [config] });

module.exports = {

	configClient: function (hostName, portNumber) {
		config.host = hostName;
		config.port = portNumher;
	},

	createIndex: function (indexName, cb) {
		client.indices.create({
			index: indexName,
			body: {
				index: {
					number_of_shards: 1,
					number_of_replicas: 1
				}
			}
		}, cb)
	},

	//make sure that the specified index exists
	// if it does status returns 200, res returns a string value 'true' or 'false'   ¯\_(ツ)_/¯ 
	indexExists: function (indexName, cb) {
		client.indices.exists({ index: indexName }, cb);
	},

	search: function (indexName, typeName, query, cb) {
		client.search({
			index: indexName,
			type: typeName,
			q: query,
			size: 10000,
		}, cb)
	},

	//Indexes items that are passed to the body 
	//All items are saved in a bulk, which is unique for each table
	//Bulks can be found at  src/mongoBulks/mongoMapping.js or src/sqlBulks/sqlMapping.js
	indexItems: function (bulk, cb) {
		client.bulk({
			maxRetries: 5,
			body: bulk
		}, cb)

	},

	// push a single item to a specified index 
	indexSingleItem: function (itemBody, itemIndex, itemType, cb) {
		client.index({
			index: itemIndex,
			type: itemType,
			body: itemBody,
		}, cb)
	},

	delete: function (indexName, query, cb) {
		client.deleteByQuery({
			index: indexName,
			body: {
				query: query
			}
		}, cb)
	},
}