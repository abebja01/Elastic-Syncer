 ## Overview

This repository holds several small applications necessary to support the use of Kibana and ElasticSearch to visualize data.

### Scripts in Repository

* ### sqlToElastic.js
	`npm run sqlToElastic` - This node app is responsible for transferring  Sql logging data into ElasticSearch.

* ### mongoToElastic.js
	`npm run mongoToElastic` - This node app is responsible for transferring Mongo logging data into ElasticSearch.



### Application Type

 * These apps were developed using Node 6.10.3
 * The scripts require access to a MongoDb database, Sql Server, the ElasticSearch Server, and should be called as a scheduled task.


### Logging

- This app will log its errors to the centralizedloggingerrors index in ElasticSearch , (you can change this to your needs)

 

## For information about IndexMongoToElastic/IndexSqlToElastic functions , please refer to the config file .

  
			
## How to Store / Purge old data

Data moved to Elatic will be stored in an "Elastic index". A good way to organize the data would be to do so in terms of time, such as having different indexes for each month.  The applications in this repository currently index with the following format `indexName-MM-YYYY`. For each month an new index with data is created.  This allows us to purge old months easily by dropping the indexes from Kibana, or deleting them outright in Elastic.

Note:  The entire data can be grabbed in Kibana for visualization when creating index patterns by using regex accordingly `indexName*`. This will grab all the data from the indexes and visualize them together.
		

## ElasticSearch Shards
###### What is a shard, anyways?
Under the hood, Elasticsearch uses Lucene. Based on the way indexes work, you can't actually split an index up to distribute it across nodes in a cluster. Elasticsearch skirts around this limitation by creating multiple Lucene indexes, or shards. Simply, a shard is a Lucene index.

###### Performace
This has an important effect on performance. Since the Elasticsearch index is distributed across multiple Lucene indexes, in        order to run a complete query, Elasticsearch must first query each Lucene index, or shard, individually, combine the results, and finally score the overall result. That means using any number of shards greater than 1 will automatically incur a performance hit. 


###### How many shards should my index have?
To answer that, we need to talk about nodes. A node is simply an Elasticsearch server. A cluster is composed of one or more nodes. How many nodes you should have is a separate question, but that number is directly related to the number of shards your index should use.

Generally speaking, you'll receive the optimal performance by using the same number of shards as nodes. In a three node setup, then, your index should have three shards. However, Elasticsearch indexes have an important limitation in that they cannot be "resharded" (changing the number of shards), without also reindexing. Should you decide later that you want your three node setup to have four nodes, instead, and you only used three shards, you'll have to reindex in order to add that additional shard.

###### Documentation for shards
https://www.elastic.co/guide/en/elasticsearch/reference/current/_basic_concepts.html

###### Very Clear and Helpful article
https://qbox.io/blog/optimizing-elasticsearch-how-many-shards-per-index

###### NOTE: You cannot change the number of shards after index is created. To do that you would have to recreate and reindex all the data ...

(For more information about indexing data to ElasticSearch  , please refer to this article:)

 https://www.compose.com/articles/getting-started-with-elasticsearch-and-node/

For official documentation by ElasticSearch, please visit

https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html				                                                            