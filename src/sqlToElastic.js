"use strict";

var indexToElastic = require('./indexToElastic/indexSqlToElastic');
var sql = require('./ems/sql');
var elastic = require('./ems/elastic');
var config = require('../config.js');
var async = require('async');
var fs = require('fs');
var params = config.sqlToEsParams;

function indexEventLog(cb) {
    indexToElastic.indexSqlToElastic(
        params.sqlTable,
        params.primaryKey,
        params.bulkSize,
        params.indexName,
        params.docType,
        cb
    );
}

var isRunning = false;
var timeoutCount = 0;
var startTime = new Date();
var Max_Run_Time = 50 * 60 * 1000; /* ms */

function sync() {
	console.log('Starting Next Batch');

    isRunning = true;

    async.waterfall([
        sql.open,
        indexEventLog,
        sql.close,
        () => {
            isRunning = false;
            timeoutCount = 0;
        },
    ], function (err) {
        if (!err) { return console.log('Everything was indexed with success!'); }
		else { console.log(err); }
		
        var sqlErr = err;
        var errorLog = {
            "Time": new Date(Date.now()),
            sqlErr
        };

        console.log('logging error to elastic search');
        elastic.indexSingleItem(errorLog, 'centralizedloggingerrors', 'sqlError', function (err) {
        	console.log('error logged to elastic search');

            if (!err) { return process.exit(); }

            fs.writeFile('../errorlog', sqlErr, function (error) {
                if (!error) { return process.exit(); }
                
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
        timeoutCount++;
        if (timeoutCount == 5) {
	    	console.log('Application Exiting after 5 batch attempts timed out.')
            process.exit();
        }
    }
}, params.indexInterval);