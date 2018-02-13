"use strict";

var mongo = require('../ems/mongo');
var elastic = require('../ems/elastic');
var objectId = require('mongodb').ObjectID;
var async = require('async');
var mongoToEsParams = require('../../config').mongoToEsParams;
var createElasticMap = require('../elasticMapping/createElasticMap.js').CreateMapping;
var sql = require('../ems/sql');
//   IndexMongoToElastic(<collection>,<mapFunc>,<bulkSize>,<IndexName>,<type>,<callback>)

/**                     ========= Indexing To Elastic ===========
 * @param {string} collectionName  - Name of the collection in MongoDb .
 * @param {function} mapFunc - Takes in as a parameter the function that creates the array of data ready to be indexed to ElasticSearch 
 * @param {int} bulkSize - Specifies the amount of data to be pulled and indexed in Elastic in one interval.
 * @param {string} indexName - Index name identifies the collection of data in Elastic.
 * @param {string} type - One index can hold different types of data, which can be identified  by type
 * @param {function} cb  - function callback
 * 
 * **/
module.exports = {
    indexMongoToElastic: function IndexMongoToElastic(collectionName, bulkSize, indexName, type, cb) {

        async.waterfall(
            [
                ensureIndex,
                findMongoLogs,
                getApplicationNames,
                createMapArray,
                indexLogs,
                updateMongo,

            ], function (err) {
                if (!err) {
                    return cb();
                }
                return cb(err);
            });

        function findMongoLogs(callback) {
        	console.log('Querying Mongo');

            mongo.find(collectionName, {
                $or:
                [{ SyncedToElasticSearch: 0 },
                { SyncedToElasticSearch: null },
                { SyncedToElasticSearch: '' },
                { SyncedToElasticSearch: { $exists: false } }]
                }
                , bulkSize, (err, res) => {
                    if (!err) {
                        return callback(null, res);
                    }
                    return cb(err);
                });
        }

         function getApplicationNames(mongoData,callback) {
        	console.log('Querying applications table in sql');

            sql.select('select ApplicationId , ApplicationName from magradar_public.applications ', (err, res) => {
                if (!err) {
                    return callback(null, mongoData, res);
                }

                return cb(err);
            });
        }

        function createMapArray(mongoData, applicationNames, callback) {
           	console.log('Mapping data for ES');

            var fieldMapping = createFieldMapping(mongoData,applicationNames.recordset);
            var esDataBulk = createElasticMap(fieldMapping, indexName, type);
            return callback(null, esDataBulk, mongoData);
        }

        function indexLogs(esDataBulk, mongoData, callback) {
        	console.log('Pushing data to ES');

            elastic.indexItems(esDataBulk, function (err, res, status) {
                if (!err) {
                    return callback(null, mongoData);
                }
                return cb(err);
            });
        }

        function updateMongo(mongoData, callback) {
        	console.log('Marking Rows in Mongo as transferred');

            var syncedIdentifier = mongoSyncedIdentifier(mongoData);

            if (syncedIdentifier.length != 0) {
                mongo.update(collectionName, { _id: { $in: syncedIdentifier } }, { $set: { SyncedToElasticSearch: 1 } }, { multi: true }, (err) => {

                    if (!err) { return callback(); }
                    //Timeout is needed because on insert of new data in elasticSearch,the shard that contains that data gets refreshed after 1 sec
                    // to make that data searchable. Waiting by 1.5 sec gives plenty of time to the engine to refresh the data and make it possible to 
                    //be grabbed by the delete function
                    setTimeout(function () {
                        var esQuery = { terms: { 'log._id': syncedIdentifier } };
                        elastic.delete(indexName, esQuery, function (esErr, esRes) {
                            console.log(esErr);
                            console.log(esRes);
                            return cb(err);
                        });
                    }, 1500);
                });
            }
        }

        //Creates a Synced Identifier array, which is usually a primary key
        //It is used to identify indexed items, so their EsSynced column like  can be updated to 1 after Index
        function ensureIndex(callback) {
        	console.log('Ensuring Index Exists');

            elastic.indexExists(indexName, function (err, res, status) {
                if (!res) {
                    elastic.createIndex(indexName, function (err, res, status) {
                        if (err) {
                            return cb(err);
                        }
                    });
                }
                return callback();
            });
        }
        function mongoSyncedIdentifier(res) {

            var syncedIdentifier = [];
            for (var i = 0; i < res.length; i++) {
                var item = objectId(res[i]._id);
                syncedIdentifier.push(item);
            }

            return syncedIdentifier;
        }

        function createFieldMapping(logs,applicationNames) {
            var fieldMap = [];
       
            for (var i = 0; i < logs.length; i++) {
                logs[i].ApplicationName=getAppName(applicationNames, logs[i].ApplicationId);
                fieldMap.push(mongoToEsParams.mapping(logs[i]));
            }
            return fieldMap;
        }

		function getAppName(applicationNames, id) {
				for (var i = 0; i < applicationNames.length; i++) {
		    	if (applicationNames[i].ApplicationId === id) {
		        	return applicationNames[i].ApplicationName;
		    	}
			}
		}
    },
};