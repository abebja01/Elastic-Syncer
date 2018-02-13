"use strict";

var sqlClient = require('mssql');
var config = require('../../config').sqlConfig;



var sql = module.exports = {
    setConfig: function (userName, password, server, database,primaryKey) {
        config.user = userName;
        config.password = password;
        config.server = server;
        config.database = database;
        config.primaryKey = primaryKey;
    },

    open: function (cb) {
        console.log('Opening sql connection');
        sqlClient.connect(config, cb);
    },

    select: function (query, cb) {
        var request = new sqlClient.Request();

        request.query(query, cb);
    },

    update: function (query, cb) {
        var request = new sqlClient.Request();

        request.query(query, cb)
    },

    close: function (cb) {
        sqlClient.close();
        console.log("Closing Sql Connection");

        if (cb) cb();
    }
}

process.on('exit', function () {
    console.log('-----------------------------------------------')
    console.log('Closing  open SQL connections');
    sqlClient.close();
    console.log('All SQL connections are closed, continuing exit.');
    console.log('-----------------------------------------------')
});