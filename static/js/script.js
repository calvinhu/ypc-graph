/* Author: Calvin Hu (calvinhu00@gmail.com)
*/
$(document).ready(function() {   

	var spinner = new Spinner({color: '#fff'});

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
				spacingBottom: 0,
				marginLeft: 20

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
				labels: {
					x: -10,
					y: -2
				},
				stackLabels: {
					formatter: function() {
						return this.total == 0 ? '' : this.total;
					},
					enabled: true
				}
			},
			xAxis: {
				title: {
					text: 'yards per attempt'
				},
				allowDecimals: false,
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
					if (this.points[0].total == 0) {
						return false;
					} else {
						var s = '<b>' + this.x + ' Yard Plays</b>';

						$.each(this.points, function () {
							s += '<br/>' + this.y+ ' ' +
								this.series.name;
						});

						s += '<br/>' + this.points[0].total + ' Total plays'

						return s;
					}
				},
				shadow: false,
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
			var result = {};
			//initialize all yardages from -5 to 50 to zero
			for (var i=-5 ; i<=50 ; i++) {
				result[i] = 0;
			}
			//for each attempt, increment the yardage key by one. 50+ becomes 50, -5+ becomes -5
			$.each(list, function(index,value) {
				var yardKey = value.yards;
				if (value.yards > 50) {
					yardKey = 50;
				}
				if (value.yards < -5) {
					yardKey = -5;
				}
				result[yardKey]++;
			})
			return result;
		}

		//sort the list by yardage to make highcharts happy
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

	function displayStatTable(containerString,stats) {
		//makes the stats table next to the graph

		$(containerString + ' tbody').html('');
		$.each(stats, function(key,value) {
			$(containerString + ' tbody').append(
				$('<tr>')
					.append($('<td>').html(key))
					.append($('<td>').attr('align','right').html(value >=1000 ? addCommas(value) : value))
			)
		});
	}

	function displayPlaysTable(containerString,response) {
		//makes the play by play table below the graph

		$(containerString + ' tbody').html('');
		var color;
		$.each(response.result, function(index,value) {
			if (value.type === 'RUSH') {
				color = 'info';
			} else if (value.type === 'PASS') {
				color = 'success';
			} else if (value.type === 'INCOMPLETE') {
				color = 'danger';
			} else {
				color = 'default'
			}
			$(containerString + ' tbody').append(
				$('<tr>').addClass(color)
					.append($('<td>').attr('width',50).attr('align','right').html(value.week))
					.append($('<td>').attr('width',155).html(value.game))
					.append($('<td>').html(value.type))
					.append($('<td>').attr('width',50).attr('align','right').html(value.type === 'INCOMPLETE' ? '' : value.yards))
					.append($('<td>').html(value.desc))
			)
		});
		$(containerString).stupidtable();
		setTimeout(function() {resizeTable(containerString)},0);
	}

	function makeRushingStats(response) {
		var rush_attempts = response.result.filter(function(item) { return item.type === 'RUSH'});
		var pass_attempts = response.result.filter(function(item) { return item.type === 'PASS'});
		var stats = {};

		stats['carries'] = rush_attempts.length;
		stats['rush yards'] = rush_attempts.reduce(function(a,b) { return a + b.yards },0);
		stats['avg YPC'] = rush_attempts.length == 0 ? 0 : parseFloat(stats['rush yards'] / stats['carries']).toFixed(1);

		stats['receptions'] = pass_attempts.length;
		stats['rec yards'] = pass_attempts.reduce(function(a,b) { return a + b.yards },0);
		stats['avg YPR'] = pass_attempts.length == 0 ? 0 : parseFloat(stats['rec yards'] / stats['receptions']).toFixed(1);
		return stats;
	}

	function makeReceivingStats(response) {
		var attempts = response.result;
		var stats = {};

		stats['targets'] = attempts.length;
		stats['receptions'] = attempts.reduce(function(a,b) { return a + b.complete },0);
		stats['rec yards'] = attempts.reduce(function(a,b) { return a + b.yards },0);
		stats['rec YAC'] = attempts.reduce(function(a,b) { return a + b.yac_yards },0);
		stats['avg YPR'] = attempts == 0 ? 0 : parseFloat(stats['rec yards'] / stats['receptions']).toFixed(1);
		stats['avg YAC'] = attempts == 0 ? 0 : parseFloat(stats['rec YAC'] / stats['receptions']).toFixed(1);
		console.log(stats);
		return stats;
	}

	function showStats(response,type,statTableContainerString,playTableContainerString) {
		if (type === 'rushing') {
			displayStatTable(statTableContainerString, makeRushingStats(response));
		} else if (type === 'receiving') {
			displayStatTable(statTableContainerString, makeReceivingStats(response));
		} else {
			console.log("ERROR");
		}
		displayPlaysTable(playTableContainerString, response);
	}

	function displayList(list,containerString) {
		//populates the player selection input
		$(containerString).html('')

		$(containerString).append($('<option>').html('Select a Player').attr('selected','selected').attr('disabled','disabled'));
		var $optgroup;
		$.each(Object.keys(list).sort(), function(index,value) {
			$optgroup = $('<optgroup>').attr('label',value),
			
			$.each(list[value], function(key,value) {
				$optgroup.append($('<option>').html(value.name + ' (' + value.team + ')' ).attr('value',value.id))
			});
			$(containerString).append(
				$optgroup
			);
		});
	}

	function getStats(playerid,year,type,chartNum, callback) {
		showLoad();
		var statTableContainerString = '#statTable' + chartNum;
		var playTableContainerString = '#playTable' + chartNum;
		var graphContainerString = '#playerGraph' + chartNum;

		$.ajax({
			type: "GET",
			url: $SCRIPT_ROOT + "api/v0/" + type + "yards/" + year + "/" + playerid,
			success: function (response) { 
				hideLoad();    
				makeGraph(graphContainerString,'YPC Distribution',selectGraphValues(response));
				showStats(response,type,statTableContainerString,playTableContainerString)
				callback();
			},
			error: function (jqxhr) {
				hideLoad();
				console.log(jqxhr.statusText);

				makeError(jqxhr.statusText);
			},
		});
	}

	function submit(chartNum) {
		var playerid = $('#playerSelect' + chartNum.toString() + ' option').filter(":selected").val();
		var playerName = $('#playerSelect' + chartNum.toString() + ' option').filter(":selected").text();
		var year = $('#yearSelect' + chartNum.toString() + ' option').filter(":selected").val();
		var type = $('#typeSelect' + chartNum.toString() + ' option').filter(":selected").val();

		$('#playerGraph' + chartNum.toString()).parent().removeClass('col-md-12').addClass('col-sm-10');

		getStats(playerid, year, type, chartNum, finishRender);

		function finishRender() {
			$('#playerName' + chartNum.toString() + ', #playTableName' + chartNum.toString()).html(playerName)
			$('#statTable' + chartNum.toString()).fadeIn();
			$('.stats-row').fadeIn();
		}
	}

	(function initialize() {

		var hardCodedTop75Receivers = {"result": [{"id": "00-0027793", "name": "Antonio Brown", "team": "PIT"}, {"id": "00-0027944", "name": "Julio Jones", "team": "ATL"}, {"id": "00-0022921", "name": "Larry Fitzgerald", "team": "ARI"}, {"id": "00-0027942", "name": "A.J. Green", "team": "CIN"}, {"id": "00-0030564", "name": "DeAndre Hopkins", "team": "HOU"}, {"id": "00-0024334", "name": "Brandon Marshall", "team": "NYJ"}, {"id": "00-0026995", "name": "Jeremy Maclin", "team": "KC"}, {"id": "00-0030279", "name": "Keenan Allen", "team": "SD"}, {"id": "00-0020337", "name": "Steve Smith", "team": "BAL"}, {"id": "00-0027874", "name": "Demaryius Thomas", "team": "DEN"}, {"id": "00-0031544", "name": "Amari Cooper", "team": "OAK"}, {"id": "00-0031428", "name": "Allen Robinson", "team": "JAC"}, {"id": "00-0029269", "name": "Travis Benjamin", "team": "CLE"}, {"id": "00-0025465", "name": "James Jones", "team": "GB"}, {"id": "00-0030821", "name": "Allen Hurns", "team": "JAC"}, {"id": "00-0027656", "name": "Rob Gronkowski", "team": "NE"}, {"id": "00-0027685", "name": "Emmanuel Sanders", "team": "DEN"}, {"id": "00-0031235", "name": "Odell Beckham", "team": "NYG"}, {"id": "00-0029608", "name": "T.Y. Hilton", "team": "IND"}, {"id": "00-0030506", "name": "Travis Kelce", "team": "KC"}, {"id": "00-0023496", "name": "Vincent Jackson", "team": "TB"}, {"id": "00-0028002", "name": "Randall Cobb", "team": "GB"}, {"id": "00-0031299", "name": "Jordan Matthews", "team": "PHI"}, {"id": "00-0027150", "name": "Julian Edelman", "team": "NE"}, {"id": "00-0030472", "name": "Jordan Reed", "team": "WAS"}, {"id": "00-0029580", "name": "Rishard Matthews", "team": "MIA"}, {"id": "00-0031339", "name": "Donte Moncrief", "team": "IND"}, {"id": "00-0031382", "name": "Jarvis Landry", "team": "MIA"}, {"id": "00-0026986", "name": "Michael Crabtree", "team": "OAK"}, {"id": "00-0028112", "name": "Charles Clay", "team": "BUF"}, {"id": "00-0025389", "name": "Calvin Johnson", "team": "DET"}, {"id": "00-0025418", "name": "Greg Olsen", "team": "CAR"}, {"id": "00-0028017", "name": "Leonard Hankerson", "team": "ATL"}, {"id": "00-0030663", "name": "Willie Snead", "team": "NO"}, {"id": "00-0022127", "name": "Jason Witten", "team": "DAL"}, {"id": "00-0029159", "name": "Jermaine Kearse", "team": "SEA"}, {"id": "00-0028052", "name": "Cecil Shorts", "team": "HOU"}, {"id": "00-0026281", "name": "Gary Barnidge", "team": "CLE"}, {"id": "00-0026901", "name": "Mike Wallace", "team": "MIN"}, {"id": "00-0031051", "name": "John Brown", "team": "ARI"}, {"id": "00-0030549", "name": "Tyler Eifert", "team": "CIN"}, {"id": "00-0026998", "name": "Percy Harvin", "team": "BUF"}, {"id": "00-0026345", "name": "Pierre Garcon", "team": "WAS"}, {"id": "00-0031236", "name": "Brandin Cooks", "team": "NO"}, {"id": "00-0029004", "name": "Lance Dunbar", "team": "DAL"}, {"id": "00-0029708", "name": "Kendall Wright", "team": "TEN"}, {"id": "00-0023367", "name": "Nate Washington", "team": "HOU"}, {"id": "00-0025396", "name": "Ted Ginn", "team": "CAR"}, {"id": "00-0026364", "name": "Steve Johnson", "team": "SD"}, {"id": "00-0026019", "name": "Danny Woodhead", "team": "SD"}, {"id": "00-0027966", "name": "Mark Ingram", "team": "NO"}, {"id": "00-0026201", "name": "Martellus Bennett", "team": "CHI"}, {"id": "00-0028434", "name": "Doug Baldwin", "team": "SEA"}, {"id": "00-0031285", "name": "Devonta Freeman", "team": "ATL"}, {"id": "00-0030542", "name": "Terrance Williams", "team": "DAL"}, {"id": "00-0027891", "name": "Golden Tate", "team": "DET"}, {"id": "00-0026983", "name": "Darrius Heyward-Bey", "team": "PIT"}, {"id": "00-0027996", "name": "Torrey Smith", "team": "SF"}, {"id": "00-0027006", "name": "Kenny Britt", "team": "STL"}, {"id": "00-0027690", "name": "Eric Decker", "team": "NYJ"}, {"id": "00-0028087", "name": "Dion Lewis", "team": "NE"}, {"id": "00-0031387", "name": "Eric Ebron", "team": "DET"}, {"id": "00-0029262", "name": "Rueben Randle", "team": "NYG"}, {"id": "00-0027696", "name": "Jimmy Graham", "team": "SEA"}, {"id": "00-0029275", "name": "Ladarius Green", "team": "SD"}, {"id": "00-0029000", "name": "Cole Beasley", "team": "DAL"}, {"id": "00-0030107", "name": "Theo Riddick", "team": "DET"}, {"id": "00-0028040", "name": "Jordan Cameron", "team": "MIA"}, {"id": "00-0027089", "name": "Louis Murphy", "team": "TB"}, {"id": "00-0022414", "name": "Malcom Floyd", "team": "SD"}, {"id": "00-0028497", "name": "Kamar Aiken", "team": "BAL"}, {"id": "00-0029293", "name": "Marvin Jones", "team": "CIN"}, {"id": "00-0024466", "name": "Marques Colston", "team": "NO"}, {"id": "00-0027061", "name": "Jared Cook", "team": "STL"}, {"id": "00-0029632", "name": "Mohamed Sanu", "team": "CIN"}, {"id": "00-0030431", "name": "Robert Woods", "team": "BUF"}, {"id": "00-0030460", "name": "Markus Wheaton", "team": "PIT"}, {"id": "00-0026213", "name": "Jamaal Charles", "team": "KC"}, {"id": "00-0030992", "name": "Crockett Gillmore", "team": "BAL"}, {"id": "00-0030047", "name": "Marquess Wilson", "team": "CHI"} ] };
		var hardCodedTop75Rushers = {"result": [{"id": "00-0025394", "name": "Adrian Peterson", "team": "MIN"}, {"id": "00-0026184", "name": "Matt Forte", "team": "CHI"}, {"id": "00-0027531", "name": "Chris Ivory", "team": "NYJ"}, {"id": "00-0026213", "name": "Jamaal Charles", "team": "KC"}, {"id": "00-0026164", "name": "Chris Johnson", "team": "ARI"}, {"id": "00-0030513", "name": "Latavius Murray", "team": "OAK"}, {"id": "00-0030456", "name": "Giovani Bernard", "team": "CIN"}, {"id": "00-0029613", "name": "Doug Martin", "team": "TB"}, {"id": "00-0031045", "name": "Carlos Hyde", "team": "SF"}, {"id": "00-0026373", "name": "Justin Forsett", "team": "BAL"}, {"id": "00-0029141", "name": "Alfred Morris", "team": "WAS"}, {"id": "00-0032209", "name": "T.J. Yeldon", "team": "JAC"}, {"id": "00-0031285", "name": "Devonta Freeman", "team": "ATL"}, {"id": "00-0030485", "name": "Eddie Lacy", "team": "GB"}, {"id": "00-0030388", "name": "Joseph Randle", "team": "DAL"}, {"id": "00-0032144", "name": "Melvin Gordon", "team": "SD"}, {"id": "00-0023500", "name": "Frank Gore", "team": "IND"}, {"id": "00-0032152", "name": "Karlos Williams", "team": "BUF"}, {"id": "00-0026153", "name": "Jonathan Stewart", "team": "CAR"}, {"id": "00-0024242", "name": "DeAngelo Williams", "team": "PIT"}, {"id": "00-0031075", "name": "Alfred Blue", "team": "HOU"}, {"id": "00-0027966", "name": "Mark Ingram", "team": "NO"}, {"id": "00-0031939", "name": "Matt Jones", "team": "WAS"}, {"id": "00-0027939", "name": "Cam Newton", "team": "CAR"}, {"id": "00-0027974", "name": "Colin Kaepernick", "team": "SF"}, {"id": "00-0030656", "name": "Isaiah Crowell", "team": "CLE"}, {"id": "00-0029683", "name": "Ronnie Hillman", "team": "DEN"}, {"id": "00-0030496", "name": "Le'Veon Bell", "team": "PIT"}, {"id": "00-0029263", "name": "Russell Wilson", "team": "SEA"}, {"id": "00-0031301", "name": "Jeremy Hill", "team": "CIN"}, {"id": "00-0027791", "name": "James Starks", "team": "GB"}, {"id": "00-0031897", "name": "Thomas Rawls", "team": "SEA"}, {"id": "00-0032241", "name": "Todd Gurley", "team": "STL"}, {"id": "00-0028087", "name": "Dion Lewis", "team": "NE"}, {"id": "00-0027029", "name": "LeSean McCoy", "team": "BUF"}, {"id": "00-0026019", "name": "Danny Woodhead", "team": "SD"}, {"id": "00-0027155", "name": "Rashad Jennings", "team": "NYG"}, {"id": "00-0027864", "name": "Ryan Mathews", "team": "PHI"}, {"id": "00-0029615", "name": "Lamar Miller", "team": "MIA"}, {"id": "00-0028064", "name": "Bilal Powell", "team": "NYJ"}, {"id": "00-0025399", "name": "Marshawn Lynch", "team": "SEA"}, {"id": "00-0031413", "name": "Bishop Sankey", "team": "TEN"}, {"id": "00-0031055", "name": "Andre Williams", "team": "NYG"}, {"id": "00-0029854", "name": "C.J. Anderson", "team": "DEN"}, {"id": "00-0032104", "name": "Ameer Abdullah", "team": "DET"}, {"id": "00-0027651", "name": "Dexter McCluster", "team": "TEN"}, {"id": "00-0026144", "name": "Darren McFadden", "team": "DAL"}, {"id": "00-0032058", "name": "Tevin Coleman", "team": "ATL"}, {"id": "00-0028118", "name": "Tyrod Taylor", "team": "BUF"}, {"id": "00-0023459", "name": "Aaron Rodgers", "team": "GB"}, {"id": "00-0032257", "name": "Duke Johnson", "team": "CLE"}, {"id": "00-0030348", "name": "Khiry Robinson", "team": "NO"}, {"id": "00-0030404", "name": "Chris Thompson", "team": "WAS"}, {"id": "00-0029438", "name": "Chris Polk", "team": "HOU"}, {"id": "00-0031407", "name": "Blake Bortles", "team": "JAC"}, {"id": "00-0023436", "name": "Alex Smith", "team": "KC"}, {"id": "00-0032187", "name": "David Johnson", "team": "ARI"}, {"id": "00-0031390", "name": "Charles Sims", "team": "TB"}, {"id": "00-0027325", "name": "LeGarrette Blount", "team": "NE"}, {"id": "00-0023564", "name": "Darren Sproles", "team": "PHI"}, {"id": "00-0030525", "name": "Tavon Austin", "team": "STL"}, {"id": "00-0027994", "name": "Shane Vereen", "team": "NYG"}, {"id": "00-0031682", "name": "Terron Ward", "team": "ATL"}, {"id": "00-0030287", "name": "Andre Ellington", "team": "ARI"}, {"id": "00-0029004", "name": "Lance Dunbar", "team": "DAL"}, {"id": "00-0026069", "name": "Mike Tolbert", "team": "CAR"}, {"id": "00-0031577", "name": "Javorius Allen", "team": "BAL"}, {"id": "00-0029668", "name": "Andrew Luck", "team": "IND"}, {"id": "00-0031237", "name": "Teddy Bridgewater", "team": "MIN"}, {"id": "00-0029795", "name": "Benny Cunningham", "team": "STL"}, {"id": "00-0024226", "name": "Jay Cutler", "team": "CHI"}, {"id": "00-0029510", "name": "Jonathan Grimes", "team": "HOU"}, {"id": "00-0031503", "name": "Jameis Winston", "team": "TB"}, {"id": "00-0023682", "name": "Ryan Fitzpatrick", "team": "NYJ"}, {"id": "00-0031375", "name": "Terrance West", "team": "TEN"}, {"id": "00-0026796", "name": "Arian Foster", "team": "HOU"}, {"id": "00-0028009", "name": "DeMarco Murray", "team": "PHI"}, ] };

		var groupedByTeamReceivers = groupBy(hardCodedTop75Receivers.result, function (obj) {
			return obj.team;
		});
		var groupedByTeamRushers = groupBy(hardCodedTop75Rushers.result, function (obj) {
			return obj.team;
		});

		displayList(groupedByTeamRushers, '#playerSelect1');
		displayList(groupedByTeamRushers, '#playerSelect2');

		$('#playerSelect1').focus();

		// setTimeout(function() { $('#playerSelect1').css('border','2px #5cb85c solid')}, 0);

		//show and hide the second graph
		var hiddenSecondGraph = true;
		$('#addSecondPlayer').click(function() {
			if (hiddenSecondGraph) {
				$('.hidden-chart').fadeIn();
				$('#addSecondPlayer').text('Hide Second Graph').removeClass('btn-primary').addClass('btn-danger');
				$('#playTable1').parent().removeClass('col-sm-12').addClass('col-sm-6');

				hiddenSecondGraph = false;
				$(this).blur();
			} else {
				$('.hidden-chart').fadeOut();
				$('#addSecondPlayer').text('Show Second Graph').removeClass('btn-danger').addClass('btn-primary');
				$('#playTable1').parent().removeClass('col-sm-6').addClass('col-sm-12');

				hiddenSecondGraph = true;
				$(this).blur();
			}
			setTimeout(function() {resizeTable('.play-container')},0);
		});

		$('#form1').submit(function(e) {
			e.preventDefault();
			$(this).blur();
			submit(1);
		});

		$('#form2').submit(function(e) {
			e.preventDefault();
			$(this).blur();
			submit(2);
		});

		$('#typeSelect1').change(function(event) {
			var position = $('#typeSelect1 option').filter(":selected").val();
			if (position === 'rushing') {
				displayList(groupedByTeamRushers, '#playerSelect1');
			} else if (position === 'receiving') {
				displayList(groupedByTeamReceivers, '#playerSelect1');
			} else {
				console.log("ERROR");
			}
			$('#submit1').prop('disabled',true);

		});

		$('#typeSelect2').change(function(event) {
			var position = $('#typeSelect2 option').filter(":selected").val();
			if (position === 'rushing') {
				displayList(groupedByTeamRushers, '#playerSelect2');
			} else if (position === 'receiving') {
				displayList(groupedByTeamReceivers, '#playerSelect2');
			} else {
				console.log("ERROR");
			}
			$('#submit2').prop('disabled',true);
		});

		$('#playerSelect1').change(function() {
			$('#submit1').prop('disabled',false);
			$('#playerSelect1').css('border','1px solid #ccc')

		});

		$('#playerSelect2').change(function() {
			$('#submit2').prop('disabled',false);
		});

		$(window).resize(function() {
			resizeTable('.play-container');
		});
	}())

});