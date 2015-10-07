/* Author: Calvin Hu (calvinhu00@gmail.com)
*/
$(document).ready(function() {   

	// var API_URL = 'http://localhost:5000/'
	var API_URL = 'https://ypc.herokuapp.com/'
	var spinner = new Spinner({color: '#fff'});

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

	function showLoad() {
		$('#overlay').show();
		spinner.spin(document.getElementById('overlay'));
	}

	function hideLoad() {
		$('#overlay').hide();
			spinner.stop();
	}

	function makeGraph(container,title,data) {
		$(container).highcharts({
			credits: {
				enabled: false
			},
			chart: {
				type: 'column',
				height: 250,

				alignTicks: false

			},
			title: {
				text: title,
				floating: true,
				x: -20 //center
			},
			yAxis: {
				title: {
					text: ''
				},
				allowDecimals: false,
				gridLineWidth: 0,
				minorGridLineWidth: 0,
				lineColor: 'transparent',
				min: 0,
				stackLabels: {
					enabled: true
				}
			},
			xAxis: {
				title: {
					text: 'yards per attempt'
				},
				allowDecimals: false,
				// floor: -5,
				// ceiling: 50,
				endOnTick: true,
				startOnTick: true,
				min: -5,
				max: 50,
				minPadding: 0,
				maxPadding: 0,
				tickInterval: 5,
				minorTickInterval: 1,
				minorTickLength: 5,
				minorGridLineWidth: 0,
				minorTickWidth: 1
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'top',
				borderWidth: 0,
				floating: true
			},
			tooltip: {
				formatter: function () {
					var s = '<b>' + this.x + ' Yard Plays</b>';

					$.each(this.points, function () {
						s += '<br/>' + this.y+ ' ' +
							this.series.name;
					});

					s += '<br/>' + this.points[0].total + ' Total plays'

					return s;
				},
				shared: true
			},
			plotOptions: {
				column: {
					groupPadding: 0,
					borderWidth: 0,
					shadow: false,

				},
				series: {
					stacking: 'normal'
				}
			},
			series: data
		});
		var lastLabel = $(container).find('.highcharts-axis-labels.highcharts-xaxis-labels').find('text').last();
		var firstLabel = $(container).find('.highcharts-axis-labels.highcharts-xaxis-labels').find('text').first();
		if (lastLabel.text() === '50') {
			lastLabel.text('50+');
		}
		if (firstLabel.text() === '-5') {
			firstLabel.text('-5+');
		}
	}

	function selectGraphValues(response) {
		var rush_attempts = response.result.filter(function(item) { return item.type === 'RUSH'});
		var pass_attempts = response.result.filter(function(item) { return item.type === 'PASS'});

		function aggregate(list) {
			result = {};
			$.each(list, function(index,value) {
				var yardKey = value.yards;
				if (value.yards > 50) {
					yardKey = 50;
				}
				if (value.yards < -5) {
					yardKey = -5;
				}
				if (result[yardKey]) {
					result[yardKey]++;
				} else {
					result[yardKey] = 1;
				}
			})
			return result;
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

		function compare(a,b) {
			if (parseInt(a[0]) < parseInt(b[0]))
				return -1;
			if (parseInt(a[0]) > parseInt(b[0]))
				return 1;
			return 0;
		}

		var result = [
			{
				name: 'RUSH',
				color: '#7CB5EC',
				data: objToList(aggregate(rush_attempts)).sort(compare)
			},
			{
				name: 'PASS',
				color: '#90ED7D',
				data: objToList(aggregate(pass_attempts)).sort(compare)
			},
		];

		return result;
	}

	function showStats(response,containerString) {
		// var rush_attempts = response.result.filter(function(item) { return item.type === 'RUSH'});
		// var pass_attempts = response.result.filter(function(item) { return item.type === 'PASS'});
		$(containerString + ' tbody').html('');
		$.each(response.result, function(index,value) {
			$(containerString + ' tbody').append(
				$('<tr>').addClass(value.type === 'RUSH' ? 'info' : 'success')
					.append($('<td>').attr('align','right').html(value.week))
					.append($('<td>').html(value.game))
					.append($('<td>').html(value.type))
					.append($('<td>').attr('align','right').html(value.yards))
					.append($('<td>').html(value.desc))
			)
		});
		$(containerString).stupidtable();
	}

	function getRushersList() {
		$('#rbList').html('');
		$('#rbList2').html('');
		showLoad();

		var hardCodedTop50 = {"result": [{"id": "00-0025394", "name": "Adrian Peterson", "team": "MIN"}, {"id": "00-0026184", "name": "Matt Forte", "team": "CHI"}, {"id": "00-0027531", "name": "Chris Ivory", "team": "NYJ"}, {"id": "00-0026213", "name": "Jamaal Charles", "team": "KC"}, {"id": "00-0026164", "name": "Chris Johnson", "team": "ARI"}, {"id": "00-0030513", "name": "Latavius Murray", "team": "OAK"}, {"id": "00-0030456", "name": "Giovani Bernard", "team": "CIN"}, {"id": "00-0029613", "name": "Doug Martin", "team": "TB"}, {"id": "00-0031045", "name": "Carlos Hyde", "team": "SF"}, {"id": "00-0026373", "name": "Justin Forsett", "team": "BAL"}, {"id": "00-0029141", "name": "Alfred Morris", "team": "WAS"}, {"id": "00-0032209", "name": "T.J. Yeldon", "team": "JAC"}, {"id": "00-0031285", "name": "Devonta Freeman", "team": "ATL"}, {"id": "00-0030485", "name": "Eddie Lacy", "team": "GB"}, {"id": "00-0030388", "name": "Joseph Randle", "team": "DAL"}, {"id": "00-0032144", "name": "Melvin Gordon", "team": "SD"}, {"id": "00-0023500", "name": "Frank Gore", "team": "IND"}, {"id": "00-0032152", "name": "Karlos Williams", "team": "BUF"}, {"id": "00-0026153", "name": "Jonathan Stewart", "team": "CAR"}, {"id": "00-0024242", "name": "DeAngelo Williams", "team": "PIT"}, {"id": "00-0031075", "name": "Alfred Blue", "team": "HOU"}, {"id": "00-0027966", "name": "Mark Ingram", "team": "NO"}, {"id": "00-0031939", "name": "Matt Jones", "team": "WAS"}, {"id": "00-0027939", "name": "Cam Newton", "team": "CAR"}, {"id": "00-0027974", "name": "Colin Kaepernick", "team": "SF"}, {"id": "00-0030656", "name": "Isaiah Crowell", "team": "CLE"}, {"id": "00-0029683", "name": "Ronnie Hillman", "team": "DEN"}, {"id": "00-0030496", "name": "Le'Veon Bell", "team": "PIT"}, {"id": "00-0029263", "name": "Russell Wilson", "team": "SEA"}, {"id": "00-0031301", "name": "Jeremy Hill", "team": "CIN"}, {"id": "00-0027791", "name": "James Starks", "team": "GB"}, {"id": "00-0031897", "name": "Thomas Rawls", "team": "SEA"}, {"id": "00-0032241", "name": "Todd Gurley", "team": "STL"}, {"id": "00-0028087", "name": "Dion Lewis", "team": "NE"}, {"id": "00-0027029", "name": "LeSean McCoy", "team": "BUF"}, {"id": "00-0026019", "name": "Danny Woodhead", "team": "SD"}, {"id": "00-0027155", "name": "Rashad Jennings", "team": "NYG"}, {"id": "00-0027864", "name": "Ryan Mathews", "team": "PHI"}, {"id": "00-0029615", "name": "Lamar Miller", "team": "MIA"}, {"id": "00-0028064", "name": "Bilal Powell", "team": "NYJ"}, {"id": "00-0025399", "name": "Marshawn Lynch", "team": "SEA"}, {"id": "00-0031413", "name": "Bishop Sankey", "team": "TEN"}, {"id": "00-0031055", "name": "Andre Williams", "team": "NYG"}, {"id": "00-0029854", "name": "C.J. Anderson", "team": "DEN"}, {"id": "00-0032104", "name": "Ameer Abdullah", "team": "DET"}, {"id": "00-0027651", "name": "Dexter McCluster", "team": "TEN"}, {"id": "00-0026144", "name": "Darren McFadden", "team": "DAL"}, {"id": "00-0032058", "name": "Tevin Coleman", "team": "ATL"}, {"id": "00-0028118", "name": "Tyrod Taylor", "team": "BUF"}, {"id": "00-0023459", "name": "Aaron Rodgers", "team": "GB"} ] }
		var groupedByTeam = groupBy(hardCodedTop50.result, function (obj) {
		    return obj.team;
		});
		// $.ajax({
		// 	type: "GET",
		// 	url: API_URL + "toprushers",
		// 	success: function (response) {
		// 		hideLoad();
		// 		$('#rbSelect').append($('<option>').html('Select a Player').attr('selected','selected').attr('disabled','disabled'))
		// 		$.each(response.result, function(key,value) {
		// 			$('#rbSelect').append(
		// 				$('<option>').html(value.name + ' (' + value.team + ')' ).attr('value',value.id)
		// 			)
		// 		});
		// 	},
		// 	error: function (jqxhr) {
		// 		hideLoad();
		// 		console.log(jqxhr.statusText);

		// 		makeError(jqxhr.statusText);
		// 	},
		// });

		hideLoad();
		$('#rbSelect, #rbSelect2').append($('<option>').html('Select a Player').attr('selected','selected').attr('disabled','disabled'));
		var $optgroup;
		$.each(Object.keys(groupedByTeam).sort(), function(index,value) {
			$optgroup = $('<optgroup>').attr('label',value),
			
			$.each(groupedByTeam[value], function(key,value) {
				$optgroup.append($('<option>').html(value.name + ' (' + value.team + ')' ).attr('value',value.id))
			});
			$('#rbSelect, #rbSelect2').append(
				$optgroup
			);
		});
	}

	function getRusherStats(playerid,year,containerString) {
		showLoad()
		$.ajax({
			type: "GET",
			url: $SCRIPT_ROOT + "rushingyards/" + year + "/" + playerid,
			success: function (response) { 
				hideLoad();    
				makeGraph(containerString,'YPC Distribution',selectGraphValues(response))
				if (containerString === '#rusherYardsGraph') {
					showStats(response, '#statsTable');
				} else if (containerString === '#rusherYardsGraph2'){
					showStats(response, '#statsTable2');
				} else {
					console.log("ERROR");
				}
			},
			error: function (jqxhr) {
				hideLoad();
				console.log(jqxhr.statusText);

				makeError(jqxhr.statusText);
			},
		});
	}

	(function initialize() {

		getRushersList();
		var hiddenSecondGraph = true;
		$('#addSecondPlayer').click(function() {
			if (hiddenSecondGraph) {
				$('.second-rusher').show();
				$('#addSecondPlayer').text('Hide Second Graph');
				$('#statsTable').parent().removeClass('col-sm-12').addClass('col-sm-6');
				hiddenSecondGraph = false;
			} else {
				$('.second-rusher').hide();
				$('#addSecondPlayer').text('Show Second Graph');
				$('#statsTable').parent().removeClass('col-sm-6').addClass('col-sm-12');
				hiddenSecondGraph = true;
			}
		});

		$('#submit').click(function(event) {
			var playerid = $('#rbSelect option').filter(":selected").val();
			var playerName = $('#rbSelect option').filter(":selected").text();
			var year = $('#yearSelect option').filter(":selected").val();
			getRusherStats(playerid, year, '#rusherYardsGraph');
			$('#playerName, #tablePlayerName').html(playerName)
		});

		$('#submit2').click(function(event) {
			var playerid = $('#rbSelect2 option').filter(":selected").val();
			var playerName = $('#rbSelect2 option').filter(":selected").text();
			var year = $('#yearSelect2 option').filter(":selected").val();
			getRusherStats(playerid, year, '#rusherYardsGraph2');
			$('#playerName2, #tablePlayerName2').html(playerName)
		});

		$('#forteButton').click(function() {
			var year = $('#yearSelect option').filter(":selected").val();
			getRusherStats('00-0026184', year);
			$('#playerName').html('Matt Forte (CHI)')
		})
	}())

});