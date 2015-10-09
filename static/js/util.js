function makeError(message) {
	var button = $('<button>').addClass('close').attr('type','button').attr('data-dismiss','alert').html('&times;');
	$('.errors').append(
		$('<div>').addClass('alert alert-danger alert-dismissable').html(message).append(button)
	);
}

function groupBy(array, predicate) {
	var grouped = {};
	for(var i = 0; i < array.length; i++) {
		var groupKey = predicate(array[i]);
		if (typeof(grouped[groupKey]) === "undefined")
			grouped[groupKey] = [];
		grouped[groupKey].push(array[i]);
	}

	return grouped;
}

function addCommas(intNum) {
	return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}