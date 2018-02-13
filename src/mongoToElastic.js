"use strict";

var indexToElastic = require('./indexToElastic/indexMongoToElastic');
var config = require('../config.js');
var mongoConfig = require('../config.js').mongoConfig;
var mongo = require('./ems/mongo');
var elastic = require('./ems/elastic');
var async = require('async');
var fs = require('fs');
var sql = require('./ems/sql');

var params = config.mongoToEsParams;
function indexLoggingData(cb) {

    indexToElastic.indexMongoToElastic(
        params.collection,
        params.bulkSize,
        params.indexName,
        params.docType,
        cb
    );
}

var isRunning = false;
var tryCount = 0;
var startTime = new Date();
var Max_Run_Time = 50 * 60 * 1000; /* ms */

function sync() {
	console.log('Starting Next Batch');

    isRunning = true;

    async.waterfall([
    	mongo.setConn.bind(null, mongoConfig.username, mongoConfig.password, mongoConfig.ip, mongoConfig.dbName, mongoConfig.replicaSetName),
        mongo.open,
        sql.open,
        indexLoggingData,
        mongo.close,
        sql.close,
        () => {
            isRunning = false;
            tryCount = 0;
        },
    ], function (err) {
        if (!err) { console.log('Everything was indexed with success!'); }
        else { console.log(err); }
        
        var mongoErr = err;
        var errorLog = {
            "Time": new Date(Date.now()),
            mongoErr
        };

        elastic.indexSingleItem(errorLog, 'centralizedloggingerrors', 'MongoError', function (err) {
            if (!err) { process.exit(); }

            fs.writeFile('../errorlog', mongoErr, function (error) {
                if (!error) { process.exit(); }

                console.log(error);

                return process.exit();
            });
        });
    });
}

console.log('Setting Interval');
setInterval(() => {
	console.log('Application is starting');

	if (new Date() - startTime > Max_Run_Time) {
		console.log('Exiting after ' + Max_Run_Time / (60 * 60 * 1000) + ' Minutes');
		return process.exit();
	}
	
    if (!isRunning) {
        sync();
    } else {
        tryCount++;
        if (tryCount == 5) {
	    	console.log('Application Exiting after 5 batch attempts timed out.')
            process.exit();
        }
    }
}, params.indexInterval);