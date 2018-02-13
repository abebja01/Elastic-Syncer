var elasticMapping = require('./src/elasticMapping/createElasticMap');

var date = new Date(Date.now());
var month = date.getMonth() + 1;
var year = date.getFullYear();


module.exports = {

    sqlConfig: {
        user: 'user',
        password: 'password',
        server: 'server',
        database: 'database',
        connectionTimeout: 600000,
        requestTimeout: 600000,
        stream: false
    },

    mongoConfig: {
    	username: "username",
    	password: "password",
    	ip: 'mongodb://localhost',
        dbName: 'dbname',
        replicaSetName: null
    },

    elasticConfig: {
        host: 'host-domain for elastic',
        port: 9200,
        auth: 'username:pass (of kibana)'
    },

    /**                     ========= mongoToEsParams ===========
     * @param {string} collection  - Collection name in MongoDb
     * @param {int} indexinterval - number of milliseconds between batches
     * @param {int} bulkSize - Specifies the amount of data to be pulled and indexed in Elastic in one interval.
     * @param {string} indexName - Index name identifies the collection of data in Elastic.
     * @param {string} docType - One index can hold different types of data, which can be identified  by docType
     *                    
     * */
    mongoToEsParams: {
        // MongoDb collection Name
        collection: 'collectionName',

        // Number of milliseconds between batches
        indexInterval: 20000,

        // number of items per batch
        bulkSize: 20000,

        // indexName for the given month
        indexName: `indexName-0${month}-${year}`,  //just put yourindexName , and you will have indexes automatically created each month

        // type of data within index 
        docType: 'logs',
       
       //field mapping
        mapping: function(log){
             
         return{
                time: log.Time,
                applicationName: log.ApplicationName,
                applicationId: log.ApplicationId,
                subLocation: log.SubLocation,
                userId: log.UserId,
                typeId: log.TypeId,
                summary: log.Summary,
                details: log.Details,
                exceptionName: log.StackTrace,
                synced: log.Synced,
                vmId: log.VMId,
                stackTrace: log.StackTrace,
                source: "mongo/mongoCollectionName" //this just helps to identify where data is coming from
              }
        }
    },



    /**                     ========= sqlToEsParams ===========
     * @param {string} sqlTable  - Sql Table   
     * @param {string} primaryKey - What is the primaryKey of this table
     * @param {int} indexinterval - number of milliseconds between batches
     * @param {int} bulkSize - Specifies the amount of data to be pulled and indexed in Elastic in one interval.
     * @param {string} indexName - Index name identifies the collection of data in Elastic.
     * @param {string} docType - One index can hold different types of data, which can be identified  by docType
     * 
     *                    
     * */
    sqlToEsParams: {
        // Sql Table to be indexed

        sqlTable: 'tableName',

        // Primary key of the sql table
        primaryKey: 'primaryKey',

        // Number of milliseconds between batches
        indexInterval: 20000,

        //Number of items per batch
        bulkSize: 20000,

        // indexName for the given month
        indexName: `eventlog-0${month}-${year}`,

        //type of data within index
        docType: 'logs',
       
       //field mapping
        mapping: function(log){
           
             
         return{
                time: log.time,
                applicationName: log.applicationName,
                applicationId: log.applicationId,
                subLocation: log.sublocation,
                userId: log.userId,
                typeId: log.typeId,
                summary: log.summary,
                details: log.details,
                stackTrace: log.stackTrace,
                exceptionName: log.exceptionName,
                tag: log.tag,
                eventLogApplicationId: log.eventLogApplicationId,
                source: "sql/sqlTableName"  //thishelps to identify where data is coming from
         }
              
    }, 

}
}