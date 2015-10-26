$(document).ready(function() { 
	function getTopPlayers(year,type,containerString) {
		showLoad();
		$.ajax({
			type: "GET",
			url: $SCRIPT_ROOT + "api/v0/data/" + year + '/' + type + '.json',
			success: function (response) {   
				displayList(response.result,type,containerString);
				hideLoad();
			},
			error: function (jqxhr) {
				hideLoad();
				console.log(jqxhr.statusText);
				makeError(jqxhr.statusText);
			},
		});
	}

	function displayList(list,type,tableString) {
		//populates the player selection input
		$('.table').hide();
		$(tableString).show();
		var $tbody = $(tableString + ' tbody');

		$tbody.html('');

		if (type === 'rushing') {
			$.each(list, function(index,value) {
				$tbody.append(
					$('<tr>')
						.append($('<td>').html(value.name))
						.append($('<td>').html(value.team))
						.append($('<td>').attr('align','right').html(addCommas(value.rushing_yds)))
						.append($('<td>').attr('align','right').html(value.rushing_att))
						.append($('<td>').attr('align','right').html(parseFloat(value.rushing_yds / value.rushing_att).toFixed(1) ))
				)
			});
		} else {
			$.each(list, function(index,value) {
				$tbody.append(
					$('<tr>')
						.append($('<td>').html(value.name))
						.append($('<td>').html(value.team))
						.append($('<td>').attr('align','right').html(addCommas(value.receiving_yds)))
						.append($('<td>').attr('align','right').html(value.receiving_rec))
						.append($('<td>').attr('align','right').html(parseFloat(value.receiving_yds / value.receiving_rec).toFixed(1) ))
				)
			});
		}

		
		$(tableString).stupidtable();
	}

	(function initialize() {
		selectTab('top');
		var type = $('#type').html();
		getTopPlayers(2015,type, '#' + type + 'Table');

		$('#yearSelect').change(function(event) {
			var year = $('#yearSelect option').filter(":selected").val();
			getTopPlayers(year,type, '#' + type + 'Table');
			$('.title-year').html(year);
		});
	})()

});