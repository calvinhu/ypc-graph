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

function objToList(inputObject) {
	var result = []
	for(var key in inputObject) {
		if(inputObject.hasOwnProperty(key)) {
			result.push([parseInt(key), inputObject[key]])
		}
	}
	return result;
}

function resizeTable(tableString) {
	// Change the selector if needed
	var $table = $(tableString),
		$bodyCells = $table.find('tbody tr:first').children(),
		colWidth;

	// Get the tbody columns width array
	colWidth = $bodyCells.map(function() {
		return $(this).width();
	}).get();

	// Set the width of thead columns
	$table.find('thead tr').children().each(function(i, v) {
		$(v).width(colWidth[i]);
	}); 
}

function stupid_table_search(selectContainerString, tableContainerString, regex, all){
	var $select_box = $(selectContainerString);
	var $table = $(tableContainerString);
	var text = $select_box.find('option').filter(":selected").val();
		if (text === 'allweeks') {
			$table.children('tbody').children('tr').each(function(index, row){
				$(row).show();
			});
		} else {
			if (regex) {
				var regExp = new RegExp(text, 'i');
			}
			$table.children('tbody').children('tr').each(function(index, row){
				var firstCell = $(row).find('td:eq(0)');
				var found = false;
				firstCell.each(function(index, td){
					var match;
					if (regex) {
						match = regExp.test($(firstCell).text())
					} else {
						match = $(firstCell).text() === text
					}
					if(match){
						found = true;
						return false;
					}
				});

				if(found)
					$(row).show();
				else 
					$(row).hide();
			});
		}
		
};