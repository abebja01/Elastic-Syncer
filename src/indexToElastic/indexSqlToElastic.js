"use strict";
var elastic = require('../ems/elastic');
var sql = require('../ems/sql');
var async = require('async');
var sqlToEsParams = require('../../config').sqlToEsParams;
var createElasticMap = require('../elasticMapping/createElasticMap.js').CreateMapping;
module.exports = {

    //   IndexSqlToElastic(<tableName>,<primaryKey>,<mappingFunc>,<bulksize>,<IndexName>,<type>,<callback>)
    /**                     ========= Indexing To Elastic ===========
     * @param {string} tableName  - Name of table in the Sql Server.
     * @param {string} primaryKey - What is the primaryKey of this table
     * @param {int} bulkSize - Specifies the amount of data to be pulled and indexed in Elastic in one interval.
     * @param {string} indexName - Index name identifies the collection of data in Elastic.
     * @param {string} type - One index can hold different types of data, which can be identified  by type
     * @param {function} mapFunc - Takes in as a parameter the function that creates the array of data ready to be indexed to ElasticSearch 
     * @param {function} cb  - function callback
     * 
     * **/
    indexSqlToElastic: function (tableName, primaryKey, bulkSize, indexName, type, cb) {

        async.waterfall([
            ensureIndex,
            findSqlLogs,
            getApplicationNames,
            createMapArray,
            indexLogs,
            updateSql
        ], function (err) {
            if (!err) { return cb(); }
            return cb(err);
        });

        function findSqlLogs(callback) {
        	console.log('Querying Sql');

            sql.select('select  TOP ' + bulkSize + ' * from ' + tableName + ' where SyncedToElasticSearch=0  ORDER BY ' + primaryKey + ' asc ', (err, res) => {
                if (!err) {
                    return callback(null, res);
                }

                return cb(err);
            });
        }

        function getApplicationNames(sqlData, callback) {
        	console.log('Querying applications table in sql');

            sql.select('select ApplicationId , ApplicationName from magradar_public.applications ', (err, res) => {
                if (!err) {
                    return callback(null, sqlData, res);
                }

                return cb(err);
            });
        }

        function createMapArray(sqlData, applicationNames, callback) {
        	console.log('Mapping data for ES');

            var fieldMapping = createFieldMapping(sqlData, applicationNames.recordset);
            var esDataBulk = createElasticMap(fieldMapping, indexName, type);

            return callback(null, esDataBulk, sqlData);
        }

        function indexLogs(esDataBulk, sqlData, callback) {
        	console.log('Pushing data to ES');

            elastic.indexItems(esDataBulk, function (err) {
                if (!err) {
                    return callback(null, sqlData);
                }

                return cb(err);
            });
        }

        function updateSql(sqlData, callback) {
        	console.log('Marking Rows in SQL as transferred');

            if (!sqlData.rowsAffected) return callback();

            var firstItem = sqlData.recordset[0][primaryKey];
            var lastItem = sqlData.recordset[(sqlData.rowsAffected - 1)][primaryKey];

            sql.update("update  " + tableName + "  SET SyncedToElasticSearch=1 where " + [primaryKey] + " BETWEEN " + firstItem + " AND " + lastItem, function (err, res) {
                if (!err) { return callback() };

                //Timeout is needed because on insert of new data in elasticSearch,the shard that contains that data gets refreshed after 1 sec
                // to make that data searchable. Waiting by 1.5 sec gives plenty of time to the engine to refresh the data and make it possible to 
                //be grabbed by the delete function 
                setTimeout(function () {
                    var esPrimKey = 'log.' + primaryKey;
                    var esQuery = {
                        range: {
                            [esPrimKey]:
                            {
                                "gte": firstItem,
                                "lte": lastItem,
                            }
                        }
                    };

                    elastic.delete(indexName, esQuery, function (esErr, esRes) {
                        console.log(esErr);
                        console.log(esRes);

                        return cb(err);
                    });
                }, 1500);
            });
        }

        function ensureIndex(callback) {
        	console.log('Ensuring Index Exists');

            elastic.indexExists(indexName, function (err, res, status) {

                if (!res) {
                    elastic.createIndex(indexName, function (err, res, status) {
                        return cb(err);
                    });
                }
                return callback();
            });
        }

        function createFieldMapping(sqlData, applicationNames) {
            var fieldMap = [];
            var logs= sqlData.recordset;
           
            for (var i = 0; i < sqlData.rowsAffected; i++) {
                logs[i].applicationName=getAppName(applicationNames, logs[i].applicationId);
                fieldMap.push(sqlToEsParams.mapping(logs[i]));
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
