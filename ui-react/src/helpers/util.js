var functions = {};

functions._bind = function(obj, ...methods) {
	methods.forEach( (method) => obj[method] = obj[method].bind(obj) );
}

functions.groupBy = function(array, predicate) {
	var grouped = {};
	for(var i = 0; i < array.length; i++) {
		var groupKey = predicate(array[i]);
		if (typeof(grouped[groupKey]) === 'undefined')
			grouped[groupKey] = [];
		grouped[groupKey].push(array[i]);
	}

	return grouped;
}

functions.addCommas = function(intNum) {
	return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

export default functions;