import util from './util';
var apiParser = {};

function handleNull(response) {
  return true;
}

apiParser.makeGraphData = function(response) {
    var rush_attempts = response.result.filter(function(item) { return item.type === 'RUSH'});
    var pass_attempts = response.result.filter(function(item) { return item.type === 'PASS'});
    var touchdowns = response.result.filter(function(item) { return item.yards > 0 && item.desc.indexOf('TOUCHDOWN') > -1});

    function aggregate(list) {
      var result = {};
      //initialize all yardages from -5 to 50 to zero
      for (var i=-5 ; i<=50 ; i++) {
        result[i] = 0;
      }
      //for each attempt, increment the yardage key by one. 50+ becomes 50, -5+ becomes -5
      list.forEach(function(value) {
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

    //used to convert obj to highcharts format (duples)
    function objToList(inputObject) {
      var result = []
      for(var key in inputObject) {
        if(inputObject.hasOwnProperty(key)) {
          result.push([parseInt(key), inputObject[key]])
        }
      }
      return result;
    }

    var noMarkerOnNull = objToList(aggregate(touchdowns)).map(
      function(i) {
        var a = {};
        a['x'] = i[0];
        a['y'] = i[1];
        if (i[1] == 0) {
          a['marker'] = {enabled: false};
        }
        return a
      }
    ).sort(compareObj);
    
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
        data: noMarkerOnNull,
        stack: 'touchdown',
        visible: false
      }
    ];

    return result;
}

apiParser.makeRushingStats = function(response) {
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

apiParser.makeReceivingStats = function(response) {
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

export default apiParser;