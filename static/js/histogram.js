/* Author: Calvin Hu (calvinhu00@gmail.com) */ 
$(document).ready(function() {   
	function makeGraph(container,title,data) {
		$(container).highcharts({
			credits: {
				enabled: false
			},
			chart: {
				type: 'column',
				spacingBottom: 0,
				marginLeft: 25,
				style: {
  					fontFamily: '"San Francisco", "HelveticaNeue", "Helvetica Neue", Helvetica, Arial, sans-serif'
				}
			},
			title: {
				text: '',
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
				x: -50,
				offset: -5,
				stackLabels: {
					formatter: function() {
						return this.total == 0 ? '' : this.total;
					},
					enabled: true,
				}
			},
			xAxis: {
				title: {
					text: 'yards per attempt'
				},
				allowDecimals: false,
				plotBands: [
					{
						color: '#f2dede',
						from: -5.5,
						to: -0.5
					},
					{
						color: '#f9f9f9',
						from: -0.5,
						to: 50.5
					}
				],
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
					pointPadding: 0,
					borderWidth: 1,
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
		console.log(response)
		var rush_attempts = response.result.filter(function(item) { return item.type === 'RUSH'});
		var pass_attempts = response.result.filter(function(item) { return item.type === 'PASS'});
		var touchdowns = response.result.filter(function(item) { return item.yards > 0 && item.desc.indexOf("TOUCHDOWN") > -1});

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

		//sort the list by yardage to make highcharts happy
		function compareObj(a,b) {
			if (parseInt(a['x']) < parseInt(b['x']))
				return -1;
			if (parseInt(a['x']) > parseInt(b['x']))
				return 1;
			return 0;
		}

		var test = objToList(aggregate(touchdowns)).map(
			function(i) { 
				var a = {}; 
				a['x'] = i[0]; 
				a['y'] = i[1]; 
				if (i[1] == 0) {
					a['marker'] = {enabled: false}; 
				}
				return a
			}).sort(compareObj);
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
			{
				name: 'TOUCHDOWN',
				type: 'column',
				color: '#EEA236',
				data: test,
				stack: 'touchdown',
				visible: false

			},
		];
		console.log(result)
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
			if (parseInt(value.yards) < 0) {
				color = 'danger';
			} else if (value.type === 'RUSH') {
				color = 'info';
			} else if (value.type === 'PASS') {
				color = 'success';
			} else if (value.type === 'INCOMPLETE') {
				color = 'active';
			} else {
				color = 'default'
			}
			$(containerString + ' tbody').append(
				$('<tr>').addClass(color)
					.append($('<td>').attr('width',50).attr('align','right').html(value.week).attr('data-sort-value',index))
					.append($('<td>').attr('width',155).html(value.game))
					.append($('<td>').html(value.type))
					.append($('<td>').attr('width',50).attr('align','right').html(value.type === 'INCOMPLETE' ? '' : value.yards).attr('data-sort-value',value.yards))
					.append($('<td>').attr('width',75).html(value.time))
					.append($('<td>').html(formatDescription(value.desc)))
			)
		});
		var table = $(containerString).stupidtable();
		table.on("aftertablesort", function (event, data) {
			var th = $(this).find("th");
			th.find(".arrow").remove();
			var dir = $.fn.stupidtable.dir;
			var arrow = data.direction === dir.ASC ? "&uarr;" : "&darr;";
			th.eq(data.column).append('<span class="arrow">' + arrow +'</span>');
		});
		setTimeout(function() {resizeTable(containerString)},0);
	}

	function formatDescription(input) {
		return input
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
		var $container = $(containerString);

		$container.html('');
		$container.append($('<option>').html('Select a Player').attr('selected','selected').attr('disabled','disabled'));
		var $optgroup;
		$.each(Object.keys(list).sort(), function(index,value) {
			$optgroup = $('<optgroup>').attr('label',value),
			
			$.each(list[value], function(key,value) {
				$optgroup.append($('<option>').html(value.name + ' (' + value.team + ')' ).attr('value','{"id":"'+value.id+'","team":"'+value.team+'"}'))
			});
			$container.append(
				$optgroup
			);
		});
	}

	function displayWeek(list,containerString) {
		//populates the week selection input
		var $container = $(containerString);

		$container.html('');
		$container.append($('<option>').attr('value','allweeks').html('All Weeks').attr('selected','selected'));
		$.each(list.result, function(index,value) {
			$container.append(
				$('<option>').html('Week ' + value).attr('value',value)
			);
		});
	}

	function getStats(playerid,team,year,week,type,chartNum, callback) {
		showLoad();
		var statTableContainerString = '#statTable' + chartNum;
		var playTableContainerString = '#playTable' + chartNum;
		var graphContainerString = '#playerGraph' + chartNum;

		var url;
		if (week) {
			url = $SCRIPT_ROOT + "api/v0/" + type + "yards/" + playerid + "/" + team + "/" + year + "/" + week;
		} else {
			url = $SCRIPT_ROOT + "api/v0/" + type + "yards/" + playerid + "/" + team + "/" + year;
		}

		$.ajax({
			type: "GET",
			url: url,
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

	function getWeeks(year,containerString,callback) {
		$.ajax({
			type: "GET",
			url: $SCRIPT_ROOT + "api/v0/weeks/" + year,
			success: function (response) { 
				hideLoad();    
				callback(response,containerString);
			},
			error: function (jqxhr) {
				hideLoad();
				console.log(jqxhr.statusText);
				makeError(jqxhr.statusText);
			},
		});
	}

	function submit(chartNum,week,callback) {
		var playerObj = JSON.parse($('#playerSelect' + chartNum.toString() + ' option').filter(":selected").val());

		var playerid = playerObj['id'];
		var team = playerObj['team'];

		var playerName = $('#playerSelect' + chartNum.toString() + ' option').filter(":selected").text();
		var year = $('#yearSelect' + chartNum.toString() + ' option').filter(":selected").val();
		var type = $('#typeSelect' + chartNum.toString() + ' option').filter(":selected").val();

		getStats(playerid, team, year, week, type, chartNum, finishRender);

		$('#playerGraph' + chartNum.toString()).parent().removeClass('col-md-12').addClass('col-sm-10');

		function finishRender() {
			$('#playerName' + chartNum.toString() + ', #playTableName' + chartNum.toString()).html(playerName + ' ' + year)
			$('#statTable' + chartNum.toString()).fadeIn();
			$('.stats-row').fadeIn();
			if (!week) {
				getWeeks(year,'#weekSelect'+chartNum.toString() ,displayWeek);
			}
			$('.navbar').removeClass('navbar-inverse').addClass('navbar-default')
			if (callback) {
				callback();
			}
		}
	}

	function getTopPlayers(year,type,containerString) {
		// showLoad();
		$.ajax({
			type: "GET",
			url: $SCRIPT_ROOT + "api/v0/data/" + year + '/' + type + '.json',
			success: function (response) { 
				var grouped = groupBy(response.result, function (obj) {
					return obj.team;
				});   
				displayList(grouped, containerString);
				// hideLoad();
			},
			error: function (jqxhr) {
				// hideLoad();
				console.log(jqxhr.statusText);
				makeError(jqxhr.statusText);
			},
		});
	}

	function bindUpdateMainForm(sourceString) {
		$(sourceString + ' :input').change(function(e) {
			var sourceInputString = $(e.target).attr('id');
			var targetInputString = sourceInputString.split('Splash')[0];

			var value = $('#' + sourceInputString + ' option').filter(":selected").val();
			$('#' + targetInputString + ' option').each(function() { this.selected = (this.value === value )})
			$('#' + targetInputString).trigger('change');
		})
	}

	function loadBackground(name) {
		var video = document.getElementById('bgvid');
		video.poster = '../static/img/' + name + '.png'
		$(video).fadeIn(2000)

		setTimeout(function() { 
			console.log("LOAD");
			video.src = '/api/v0/stream/' + name + '.mp4';
			video.play();

		},2000)
	}

	function removeBackground() {
		var video = document.getElementById('bgvid');
			console.log("STOP");
			video.pause()
			$(video).fadeOut(1000)
	}

	(function initialize() {

		var splash1 = true;
		var splash2 = true;
		var windowWidth = $(window).width();
		var currentScreen;

		selectTab('histogram');

		getTopPlayers(2015, 'rushing', '#playerSelect1, #playerSelect1Splash');

		bindUpdateMainForm('#form1Splash');
		var players = ['AD','MG','TR']
		var rand = players[Math.floor(Math.random() * players.length)];

		if (windowWidth < 768) {
			currentScreen = 'mobile'
			$('#bgvid').addClass('mobile');
		} else {
			currentScreen = 'desktop'
			$('#bgvid').addClass('desktop');
			loadBackground(rand);
		}

		//show and hide the second graph
		var hiddenSecondGraph = true;
		$('#addSecondPlayer').click(function() {
			getTopPlayers(2015, 'rushing', '#playerSelect2, #playerSelect2Splash');
			bindUpdateMainForm('#form2Splash');

			if (hiddenSecondGraph) {
				$('.hidden-chart').fadeIn();
				$('#addSecondPlayer').text('Hide Second Graph').removeClass('btn-default').addClass('btn-danger');
				$('#playTable1').parent().removeClass('col-sm-12').addClass('col-sm-6');

				hiddenSecondGraph = false;
				$(this).blur();
			} else {
				$('.hidden-chart').fadeOut();
				$('#addSecondPlayer').text('Show Second Graph').removeClass('btn-danger').addClass('btn-default');
				$('#playTable1').parent().removeClass('col-sm-6').addClass('col-sm-12');

				hiddenSecondGraph = true;
				$(this).blur();
			}
			setTimeout(function() {resizeTable('.play-container')},0);
		});

		$('#form1').submit(function(e) {
			e.preventDefault();
			$('#playerSelect1').blur();
			submit(1, null, function() {
				$('#addSecondPlayer').removeClass('hidden');
				splash1 ? $('#form1').removeClass('hidden') : '';
			});
		});

		$('#form2').submit(function(e) {
			e.preventDefault();
			$('#playerSelect2').blur();
			submit(2, null, function() {
				splash2 ? $('#form2').removeClass('hidden') : ''
			});
		});

		$('#typeSelect1, #yearSelect1').change(function(event) {
			var position = $('#typeSelect1 option').filter(":selected").val();
			var year = $('#yearSelect1 option').filter(":selected").val();

			getTopPlayers(year, position, '#playerSelect1');
		});

		$('#typeSelect2, #yearSelect2').change(function(event) {
			var position = $('#typeSelect2 option').filter(":selected").val();
			var year = $('#yearSelect2 option').filter(":selected").val();

			getTopPlayers(year, position, '#playerSelect2');
		});

		$('#typeSelect1Splash, #yearSelect1Splash').change(function(event) {
			var position = $('#typeSelect1Splash option').filter(":selected").val();
			var year = $('#yearSelect1Splash option').filter(":selected").val();

			getTopPlayers(year, position, '#playerSelect1Splash');
		});

		$('#typeSelect2Splash, #yearSelect2Splash').change(function(event) {
			var position = $('#typeSelect2Splash option').filter(":selected").val();
			var year = $('#yearSelect2Splash option').filter(":selected").val();

			getTopPlayers(year, position, '#playerSelect2Splash');
		});

		$('#playerSelect1').change(function() {
			$('#form1').submit();
		});

		$('#playerSelect2').change(function() {
			$('#form2').submit();
		});

		$('#weekSelect1').change(function() {
			var week = $('#weekSelect1' + ' option').filter(":selected").val();
			if (week === 'allweeks') {
				submit(1);
			} else {
				submit(1, week)
			}
			// stupid_table_search('#weekSelect1','#playTable1');
		});

		$('#weekSelect2').change(function() {
			var week = $('#weekSelect2' + ' option').filter(":selected").val();
			if (week === 'allweeks') {
				submit(2);
			} else {
				submit(2, week)
			}
			// stupid_table_search('#weekSelect2','#playTable2');
		});

		var resizeEvents = debounce(function() {
			resizeTable('.play-container');
			var windowWidth = $(window).width();
			if (windowWidth < 768 && currentScreen == 'desktop') {
				currentScreen = 'mobile';
				removeBackground();
				$('#bgvid').removeClass('desktop').addClass('mobile');
			} else if (windowWidth >= 768 && currentScreen == 'mobile') {
				currentScreen = 'desktop'
				$('#bgvid').removeClass('mobile').addClass('desktop');
				loadBackground(rand);
			} else {
			}
		},300)

		document.getElementById('bgvid').addEventListener('ended',myHandler,false);
	    function myHandler(e) {
	    	console.log("DONE")
	    	removeBackground();
	        // document.getElementById('bgvid').play();
	    }

		window.addEventListener('resize',resizeEvents);

	}())
});	