'use strict';

/* A new schema must be created for every new collection that has to be indexed
   Preferably this schema must have the same name as the Collection
*/
module.exports = {
	CreateMapping: function (fieldMap, indexName, type) {
		var bulk = []; 
		indexName = indexName.toLowerCase();

		for (var i = 0; i < fieldMap.length; i++) {
			var log=fieldMap[i];
			bulk.push(
				{
					index: {
						_index: indexName,
						_type: type
					}
				},
				{
					log
				}
				
			);
		}
		console.log('=============Bulk=====================');
		console.log('There are ' + fieldMap.length + ' items in bulk ');
		console.log('=====================================');

		return bulk;
	}


};